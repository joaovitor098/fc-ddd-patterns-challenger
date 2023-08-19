import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  async function createOrder(id: string) {
    const orderRepository = new OrderRepository();
    const productRepository = new ProductRepository();
    const customerRepository = new CustomerRepository();

    const orderCustomer = new Customer(id, "Customer 1");
    const orderAddress = new Address("Street 2", 1, "Zipcode 1", "City 1");
    orderCustomer.changeAddress(orderAddress);
    await customerRepository.create(orderCustomer);

    const product1 = new Product(id, `Product${id}`, 10);
    const product2 = new Product(
      (parseInt(id) + 1).toString(),
      `Product${id}`,
      20
    );
    await productRepository.create(product1);

    const orderItem1 = new OrderItem(
      id,
      product1.name,
      product1.price,
      product1.id,
      2
    );

    const order = new Order(id, orderCustomer.id, [orderItem1]);

    await orderRepository.create(order);

    return { order, orderCustomer, product1, orderItem1 };
  }

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should update an order", async () => {
    const orderRepository = new OrderRepository();

    const { order, orderCustomer, orderItem1 } = await createOrder("123");

    const orderItems2 = new OrderItem("124", "Product 2", 20, "124", 4);

    const orderUpdated = new Order(order.id, orderCustomer.id, [
      orderItem1,
      orderItems2,
    ]);

    orderRepository.update(orderUpdated);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id, customer_id: order.customerId },
      include: ["items"],
    });

    expect(orderModel.total).toBe(100);
  });

  it("should find order", async () => {
    const orderRepository = new OrderRepository();

    const { order } = await createOrder("123");

    const orderAlreadyExist = await orderRepository.find(order.id);

    expect(order).toStrictEqual(orderAlreadyExist);
  });

  it("should findAll order", async () => {
    const orderRepository = new OrderRepository();

    const { order } = await createOrder("123");
    const { order: order2 } = await createOrder("1234");

    const ordersAlreadyExist = await orderRepository.findAll();

    expect(ordersAlreadyExist).toStrictEqual([order, order2]);
  });
});
