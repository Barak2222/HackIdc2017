import os

dirname = os.path.dirname(__file__)

IS_DEBUG = True

PORT = 443

STATIC_PATH = os.path.join(dirname, 'client')
SERVER_ADDR = 'localhost'


class DbConfigDev(object):
    USER = 'root'
    PORT = 6669
    PASSWORD = 'Password1'
    HOST = '127.0.0.1'
    SCHEMA = 'cart_pool'
