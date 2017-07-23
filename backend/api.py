import json
import asyncio
from asyncio import coroutine
from aiohttp import web
from aiohttp.web import Response
from cauldron import PostgresStore
import random

class AnimusService:
    def __init__(self):
        PostgresStore.connect(host="127.0.0.1", port=5432, user="aman.mathur", password="",
            database="animus")

    def cleaner(self, rows):
        clean_rows = [row._asdict() for row in rows]
        # for row in clean_rows:
        #     for key in ['created', 'date_of_birth', 'ride_time', 'r_created', 'r_ride_time', 'ud_date_of_birth']:
        #         if key in row:
        #             row[key] = str(row[key])
        return clean_rows

    @coroutine
    def upload_resource(self, request):
        print('upload_resource')
        reader = yield from request.post()
        print(list(reader.keys()))
        data = list(reader.values())[0]

        # filecontent = yield from reader.next()
        resource_name = data.filename# yield from filecontent.filename
        filename = ''.join(random.choice('qwertyuiopasdfghjklzxcvbnm') for x in range(6)) + '.' + resource_name.split('.')[-1]
        data_file = data.file
        content = data_file.read()
        with open(filename, 'wb') as f:
            f.write(content)

        # size = 0
        # with open(filename, 'wb') as f:
        #     while True:
        #         chunk = yield from filecontent.read_chunk()  # 8192 bytes by default.
        #         if not chunk:
        #             break
        #         size += len(chunk)
        #         f.write(chunk)
        return Response(status=200, body=filename.encode())

    @coroutine
    def create_page(self, request):
        data = yield from request.json()
        print(data)
        row = yield from PostgresStore.insert('pages', data)
        print(row)
        return Response(status=200, body=json.dumps(row[0]).encode())

    @coroutine
    def create_trigger(self, request):
        data = yield from request.json()
        print('trigger')
        print(data)
        row = yield from PostgresStore.insert('triggers', data)
        return Response(status=200, body=json.dumps(row[0]).encode())

    @coroutine
    def get_page(self, request):
        page_id = request.GET.get('page_id', '-1')
        page_aruco_ids = request.GET.get('page_aruco_ids', '')
        print(page_aruco_ids)
        row = yield from PostgresStore.raw_sql("""select * from pages as p, triggers as t
            where t.pg_id = p.page_id and t.is_trigger_active = 'true' and p.is_page_active = 'true' and
            (p.page_id = """+str(page_id)+""" or p.page_aruco_ids = '"""+str(page_aruco_ids)+"""')""", ())
        if len(row)==0:
            return Response(status=404)
        row = self.cleaner(row)
        return_val = {}
        trigger_keys = ['trigger_id','pg_id','type','src','location_pnt','location_box','is_trigger_active']
        triggers = []
        print(list(row))
        for r in row:
            trigger = {}
            for tk in trigger_keys:
                trigger[tk] = r.pop(tk)
            triggers.append(trigger)
            return_val = r
        return_val['triggers'] = triggers
        print(return_val)
        # Add queries for getting the next the previous pages
        row = yield from PostgresStore.raw_sql("""select
            (select max(page_id) from pages where is_page_active = 'true' and page_id < """+str(return_val['page_id'])+""") as prev,
            (select min(page_id) from pages where is_page_active = 'true' and page_id > """+str(return_val['page_id'])+""") as next
            """, ())
        print(row)
        return_val['prev_page'] = row[0][0]
        return_val['next_page'] = row[0][1]
        return Response(status=200, body=json.dumps(return_val).encode())


app = web.Application()
loop = asyncio.get_event_loop()
http_service = AnimusService()

# TODO: Add paths here
app.router.add_route('POST', '/upload_resource', http_service.upload_resource)
app.router.add_route('POST', '/create_page', http_service.create_page)
app.router.add_route('POST', '/create_trigger', http_service.create_trigger)
app.router.add_route('GET', '/get_page', http_service.get_page)

app.router.add_static('/', '../')

import ssl
# print(dir(ssl))

sslcontext = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
# sslcontext.load_cert_chain('sample.crt', 'sample.key')
sslcontext.load_cert_chain('cert.pem', keyfile='key.pem')
# sslcontext.load_default_certs()

serve = loop.create_server(app.make_handler(), '0.0.0.0', 8000, ssl=sslcontext)
loop.run_until_complete(serve)

try:
    loop.run_forever()
except KeyboardInterrupt:
    pass
