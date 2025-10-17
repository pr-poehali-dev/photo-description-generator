import json
import os
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Generate AI images from text descriptions using Replicate FLUX model
    Args: event - dict with httpMethod, body containing prompt
          context - object with request_id attribute
    Returns: HTTP response with generated image URL
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_str = event.get('body', '{}')
    if not body_str:
        body_str = '{}'
    
    body_data = json.loads(body_str)
    prompt = body_data.get('prompt', '')
    
    if not prompt:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Prompt is required'}),
            'isBase64Encoded': False
        }
    
    api_key = os.environ.get('REPLICATE_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'API key not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        response = requests.post(
            'https://api.replicate.com/v1/predictions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'version': 'black-forest-labs/flux-schnell',
                'input': {
                    'prompt': prompt,
                    'num_outputs': 1,
                    'aspect_ratio': '1:1',
                    'output_format': 'jpg',
                    'output_quality': 90
                }
            }
        )
        
        if response.status_code != 201:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Failed to start generation'}),
                'isBase64Encoded': False
            }
        
        prediction = response.json()
        prediction_id = prediction.get('id')
        
        import time
        max_attempts = 60
        attempt = 0
        
        while attempt < max_attempts:
            check_response = requests.get(
                f'https://api.replicate.com/v1/predictions/{prediction_id}',
                headers={'Authorization': f'Bearer {api_key}'}
            )
            
            if check_response.status_code != 200:
                break
            
            result = check_response.json()
            status = result.get('status')
            
            if status == 'succeeded':
                output = result.get('output')
                if output and len(output) > 0:
                    image_url = output[0] if isinstance(output, list) else output
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'imageUrl': image_url}),
                        'isBase64Encoded': False
                    }
            elif status == 'failed':
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Generation failed'}),
                    'isBase64Encoded': False
                }
            
            time.sleep(1)
            attempt += 1
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Generation timeout'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
