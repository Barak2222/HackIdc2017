import xmltodict
from mysql.connector import connect
import argparse

CONNECTION_INFO = {"user": "user", "password": "1234", "host":"10.10.18.211", "database":"cart_pool", "port":6669}

def parse_xml():
    parser = argparse.ArgumentParser(description='Parse prices xml and upload to MySQL DB')
    parser.add_argument('--xml', action="store", dest='xml')

    args = parser.parse_args()
    f = open("{}".format(args.xml))
    return f.read()

def main():
    xml_content = parse_xml()
    xml_dict = xmltodict.parse(xml_content)
    item_lst = xml_dict['root']['Items']['Item']
    con = connect(**CONNECTION_INFO)
    cur = con.cursor()

    data_products = [(item['ItemName'], item['ItemPrice'], item['ManufacturerName'], item['ManufacturerItemDescription'], item['ItemCode']) for item in item_lst]

    add_product = ("INSERT INTO products2 "
                    "(name, price, manufacturer, description, item_code)"
                    "VALUES (%s, %s, %s, %s, %s)")
    cur.executemany(add_product, data_products)
    con.commit()

    cur.close()
    con.close()



if __name__ == '__main__':
    main()
