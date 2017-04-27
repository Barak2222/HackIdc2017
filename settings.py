import os

dirname = os.path.dirname(__file__)

IS_DEBUG = True

PORT = 443

STATIC_PATH = os.path.join(dirname, 'client')
SERVER_ADDR = 'localhost'


class DbConfigDev(object):
    USER = 'user'
    PORT = 6669
    PASSWORD = '1234'
    HOST = '10.10.18.211'
    SCHEMA = 'cart_pool'
