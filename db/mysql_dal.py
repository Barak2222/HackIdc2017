from decimal import Decimal

from mysql.connector import connect


def cursor_needed(func):
    def with_cursor(self, *args, **kwargs):
        cursor = None
        try:
            if not self._connection.is_connected():
                self._initialize_connection()

            cursor = self._connection.cursor()

            return func(self, cursor, *args, **kwargs)
        finally:
            if cursor:
                cursor.close()

    return with_cursor


class MySqlDal(object):
    BOOL_FIELDS = []

    AUTHENTICATE_USER = "select id, display_name from users where name=%s and password=%s"
    GET_PRODUCTS = "select * from products"
    GET_CARTS = "select c.id, c.name, c.owner, u.display_name, c.description from carts c, user_carts uc, users u where c.owner = u.id and c.id = uc.c_id and uc.u_id = %s"
    GET_COMMENTS = "select u.display_name, c.comment from comments c, users u where c.u_id = u.id and c.c_id = %s"
    GET_CART_ITEMS = "select p.id, ci.quantity, p.name, ci.owners, p.price from cart_items ci, products2 p where p.id = ci.p_id and c_id = %s"
    CREATE_CART = "insert into carts (name, owner, description) values (%s, %s, %s)"
    ADD_USER_CART = "insert into user_carts (c_id, u_id, status) values (%(c_id)s, %(u_id)s, 0)"
    USER_ID_BY_NAME = "select id from users where name = %s"
    ADD_CART_ITEM = 'insert into cart_items values (%s, %s, %s, %s)'
    ADD_COMMENT = 'insert into comments values (%s, %s, %s)'
    APPROVE_CART = 'update user_carts set status = 1 where c_id = %s and u_id = %s'
    REMOVE_CART_APPROVE = 'update user_carts set status = 0 where c_id = %s'
    REMOVE_CART_APPROVE_USER = 'update user_carts set status = 0 where c_id = %s and u_id = %s'
    DELETE_CART = 'delete from carts where id = %s'
    REMOVE_ITEM_FROM_CART = 'delete from cart_items where c_id = %s and p_id = %s'
    REGISTER = 'insert into users (name, display_name, password) values (%s, %s, %s)'
    CART_MEMBERS = 'select u.display_name, uc.status, u.id from users u, user_carts uc where u.id=uc.u_id and uc.c_id=%s'

    def __init__(self, config):
        self._config = config
        self._initialize_connection()

    def __del__(self):
        if self._connection and self._connection.is_connected():
            self._connection.close()

    def _initialize_connection(self):
        self._connection = connect(user=self._config.USER, password=self._config.PASSWORD, host=self._config.HOST,
                                   database=self._config.SCHEMA, port=self._config.PORT, buffered=True)

    def _get_row_data(self, cursor, row):
        data = {}

        for i in xrange(len(row)):
            field_name = cursor.column_names[i]
            val = row[i]

            if field_name in self.BOOL_FIELDS:
                val = bool(val)

            if type(val) == Decimal:
                val = float(val)

            data[field_name] = val

        return data

    @cursor_needed
    def authenticate_user(self, cur, user, passwd):
        cur.execute(self.AUTHENTICATE_USER, (user, passwd))

        for user_data in cur:
            return self._get_row_data(cur, user_data)

    @cursor_needed
    def get_user_id_by_name(self, cur, name):
        cur.execute(self.USER_ID_BY_NAME, (name, ))

        for user_data in cur:
            return self._get_row_data(cur, user_data)

    @cursor_needed
    def get_products(self, cur):
        products = []

        cur.execute(self.GET_PRODUCTS)

        for product in cur:
            products.append(self._get_row_data(cur, product))

        return products

    @cursor_needed
    def get_user_carts(self, cur, u_id):
        carts = []

        cur.execute(self.GET_CARTS, (u_id,))

        for cart in cur:
            carts.append(self._get_row_data(cur, cart))

        return carts

    @cursor_needed
    def get_cart_comments(self, cur, c_id):
        comments = []

        cur.execute(self.GET_COMMENTS, (c_id,))

        for comment in cur:
            comments.append(self._get_row_data(cur, comment))

        return comments

    @cursor_needed
    def get_cart_members(self, cur, c_id):
        members = []

        cur.execute(self.CART_MEMBERS, (c_id,))

        for member in cur:
            members.append(self._get_row_data(cur, member))

        return members

    @cursor_needed
    def get_cart_items(self, cur, c_id):
        items = []

        cur.execute(self.GET_CART_ITEMS, (c_id,))

        for item in cur:
            items.append(self._get_row_data(cur, item))

        return items

    @cursor_needed
    def create_cart(self, cur, u_id, name, description):
        cur.execute(self.CREATE_CART, (name, u_id, description))
        self._connection.commit()
        return cur._last_insert_id

    @cursor_needed
    def add_user_cart(self, cur, c_id, u_id):
        cur.execute(self.ADD_USER_CART, {'c_id': c_id, 'u_id': u_id})
        self._connection.commit()
        return True

    @cursor_needed
    def add_cart_item(self, cur, c_id, i_id, quantity, owner):
        cur.execute(self.ADD_CART_ITEM, (c_id, i_id, quantity, owner))
        self._connection.commit()
        return True

    @cursor_needed
    def add_comment(self, cur, c_id, u_id, comment):
        cur.execute(self.ADD_COMMENT, (c_id, u_id, comment))
        self._connection.commit()
        return True

    @cursor_needed
    def approve_cart(self, cur, c_id, u_id):
        cur.execute(self.APPROVE_CART, (c_id, u_id))
        self._connection.commit()
        return True

    @cursor_needed
    def remove_cart_approve(self, cur, c_id):
        cur.execute(self.REMOVE_CART_APPROVE, (c_id, ))
        self._connection.commit()
        return True

    @cursor_needed
    def remove_cart_approve_user(self, cur, c_id, u_id):
        cur.execute(self.REMOVE_CART_APPROVE_USER, (c_id, u_id))
        self._connection.commit()
        return True

    @cursor_needed
    def delete_cart(self, cur, c_id):
        cur.execute(self.DELETE_CART, (c_id, ))
        self._connection.commit()
        return True

    @cursor_needed
    def remove_item_from_cart(self, cur, c_id, item_id):
        cur.execute(self.REMOVE_ITEM_FROM_CART, (c_id, item_id))
        self._connection.commit()
        return True

    @cursor_needed
    def register(self, cur, name, display_name, passwd):
        cur.execute(self.REGISTER, (name, display_name, passwd))
        self._connection.commit()
        return True