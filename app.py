import os
import json

from flask import Flask, request, send_file, make_response
import mysql.connector.errors

from db.mysql_dal import MySqlDal
from settings import DbConfigDev

app = Flask(__name__)

db_dal = MySqlDal(DbConfigDev)


@app.errorhandler(mysql.connector.Error)
def db_error(err):
    return make_response('server error', 500)


@app.errorhandler(Exception)
def log_error(err):
    return make_response('server error', 500)


@app.route('/')
def index():
    return send_file(os.path.join(os.path.dirname(__file__), 'client', 'www', 'index.html'))


@app.route('/login')
def login():
    user = request.args.get('user')
    passwd = request.args.get('password')

    if not user or not passwd:
        return json.dumps(False)

    res = db_dal.authenticate_user(user, passwd)
    if not res:
        return json.dumps(False)

    return json.dumps(res['id'])


@app.route('/get_products')
def get_products():
    return json.dumps(db_dal.get_products())


@app.route('/get_user_data')
def get_user_data():
    u_id = request.args.get('user_id')
    if not u_id:
        return json.dumps(False)

    carts = db_dal.get_user_carts(u_id)

    for cart in carts:
        cart['comments'] = db_dal.get_cart_comments(cart['id'])
        cart['products'] = db_dal.get_cart_items(cart['id'])

    return json.dumps(carts)


@app.route('/create_cart')
def create_cart():
    u_id = request.args.get('user_id')
    name = request.args.get('name')

    if not u_id or not name:
        return json.dumps(False)

    return json.dumps(db_dal.create_cart(u_id, name))


@app.route('/add_user_cart')
def add_user_cart():
    u_name = request.args.get('u_name')
    c_id = request.args.get('c_id')

    if not c_id or not u_name:
        return json.dumps(False)

    u_id = db_dal.get_user_id_by_name(u_name)

    if not u_id:
        return json.dumps(False)

    return json.dumps(db_dal.add_user_cart(c_id, u_id['id']))


@app.route('/add_cart_item')
def add_cart_item():
    c_id = request.args.get('c_id')
    owner = request.args.get('owner')
    i_id = request.args.get('i_id')
    quantity = request.args.get('quantity')

    if not c_id or not owner or not i_id or not quantity:
        return json.dumps(False)

    return json.dumps(db_dal.add_cart_item(c_id, i_id, quantity, owner))


@app.route('/add_comment')
def add_comment():
    c_id = request.args.get('c_id')
    u_id = request.args.get('u_id')
    comment = request.args.get('comment')

    if not c_id or not u_id or not comment:
        return json.dumps(False)

    return json.dumps(db_dal.add_comment(c_id, u_id, comment))

@app.route('/approve_cart')
def approve_cart():
    c_id = request.args.get('c_id')
    u_id = request.args.get('u_id')
    
    if not c_id or not u_id:
        return json.dumps(False)

    return json.dumps(db_dal.approve_cart(c_id, u_id))


if __name__ == '__main__':
    app.run()