import json
import asyncio
from asyncio import coroutine
from aiohttp import web
from aiohttp.web import Response
from cauldron import PostgresStore
import random

def json_file_to_dict(_file):
    config = None
    with open(_file) as config_file:
        config = json.load(config_file)
    return config

class AnimusService:
    def __init__(self, pg_host, pg_port, pg_user, pg_password, pg_db):
        PostgresStore.connect(host=pg_host, port=pg_port, user=pg_user, password=pg_password,
            database=pg_db)

    def cleaner(self, rows):
        clean_rows = [row._asdict() for row in rows]
        return clean_rows

    @coroutine
    def upload_resource(self, request):
        reader = yield from request.post()
        data = list(reader.values())[0]

        resource_name = data.filename
        filename = ''.join(random.choice('qwertyuiopasdfghjklzxcvbnm') for x in range(6)) + '.' + resource_name.split('.')[-1]
        data_file = data.file
        content = data_file.read()
        with open(filename, 'wb') as f:
            f.write(content)

        return Response(status=200, body=filename.encode())

    @coroutine
    def create_page(self, request):
        data = yield from request.json()
        row = yield from PostgresStore.insert('pages', data)
        return Response(status=200, body=json.dumps(row[0]).encode())

    @coroutine
    def create_trigger(self, request):
        data = yield from request.json()
        row = yield from PostgresStore.insert('triggers', data)
        return Response(status=200, body=json.dumps(row[0]).encode())

    @coroutine
    def get_page(self, request):
        page_id = request.GET.get('page_id', '-1')
        page_aruco_ids = request.GET.get('page_aruco_ids', '')
        debug = request.GET.get('debug', '')
        raw_query = """select * from pages as p, triggers as t
            where t.pg_id = p.page_id and t.is_trigger_active = 'true' and p.is_page_active = 'true' and
            (p.page_id = %s or p.page_aruco_ids = %s)"""
        if debug:
            raw_query = raw_query.replace("and t.is_trigger_active = 'true' and p.is_page_active = 'true'", '')
        row = yield from PostgresStore.raw_sql(raw_query, (page_id, page_aruco_ids))
        if len(row)==0:
            return Response(status=404)
        row = self.cleaner(row)
        return_val = {}
        trigger_keys = ['trigger_id','pg_id','type','src','location_pnt','location_box','is_trigger_active']
        triggers = []
        for r in row:
            trigger = {}
            for tk in trigger_keys:
                trigger[tk] = r.pop(tk)
            triggers.append(trigger)
            return_val = r
        return_val['triggers'] = triggers
        # Add queries for getting the next the previous pages
        row = yield from PostgresStore.raw_sql("""select
            (select max(page_id) from pages where is_page_active = 'true' and page_id < """+str(return_val['page_id'])+""") as prev,
            (select min(page_id) from pages where is_page_active = 'true' and page_id > """+str(return_val['page_id'])+""") as next
            """, ())
        return_val['prev_page'] = row[0][0]
        return_val['next_page'] = row[0][1]
        return Response(status=200, body=json.dumps(return_val).encode())


app = web.Application()
loop = asyncio.get_event_loop()

config = json_file_to_dict('config.json')

http_service = AnimusService(config['DB_HOST'], config['DB_PORT'], config['DB_USER'],
    config['DB_PASSWORD'], config['DB_NAME'])

app.router.add_route('POST', '/upload_resource', http_service.upload_resource)
app.router.add_route('POST', '/create_page', http_service.create_page)
app.router.add_route('POST', '/create_trigger', http_service.create_trigger)
app.router.add_route('GET', '/get_page', http_service.get_page)

app.router.add_static('/', '../')

import ssl

sslcontext = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
sslcontext.load_cert_chain(config['SSL_CERTIFICATE'], keyfile=config['SSL_KEY'])

serve = loop.create_server(app.make_handler(), config['HTTPS_HOST'], config['HTTPS_PORT'], ssl=sslcontext)
loop.run_until_complete(serve)

try:
    loop.run_forever()
except KeyboardInterrupt:
    pass
