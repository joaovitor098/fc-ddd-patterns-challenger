import Order from "../../../../domain/checkout/entity/order";
import RepositoryInterface from "../../../../domain/@shared/repository/repository-interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import { or } from "sequelize";
import OrderItem from "../../../../domain/checkout/entity/order_item";

export default class OrderRepository implements RepositoryInterface<Order> {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        items: entity.items,
        total: entity.total(),
      },
      { where: { id: entity.id, customer_id: entity.customerId } }
    );
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: ["items"],
    });

    return orderModels.map((orderModel) => {
      const orderItems = orderModel.items.map(
        (item) =>
          new OrderItem(
            item.id,
            item.name,
            item.price,
            item.product_id,
            item.quantity
          )
      );

      return new Order(orderModel.id, orderModel.customer_id, orderItems);
    });
  }
  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findOne({
      where: { id },
      include: ["items"],
    });

    const orderItems = orderModel.items.map(
      (item) =>
        new OrderItem(
          item.id,
          item.name,
          item.price,
          item.product_id,
          item.quantity
        )
    );

    return new Order(orderModel.id, orderModel.customer_id, orderItems);
  }
}
