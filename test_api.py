import urllib.request, json, urllib.error
data = json.dumps({'message': 'hi', 'agent': 'nyaya'}).encode('utf-8')
req = urllib.request.Request('http://localhost:8000/api/chat', data=data, headers={'Content-Type': 'application/json'})
try:
    res = urllib.request.urlopen(req)
    print(res.read().decode())
except urllib.error.HTTPError as e:
    print(e.read().decode())
