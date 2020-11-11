import { OrderCancelledEvent, OrderStatus } from "@sgtickets/common"
import  mongoose  from "mongoose"
import { Message } from "node-nats-streaming"
import { Order } from "../../../models/order"
import { natsWrapper } from "../../../nats-wrapper"
import { OrderCancelledListener } from "../order-cancelled-listener"



const setup = async () => {
// Create and instance of the listener
const listener = new OrderCancelledListener(natsWrapper.client)


const order = Order.build({
  id: mongoose.Types.ObjectId().toHexString(),
  status: OrderStatus.Created,
  version: 0,
  price: 30,
  userId: 'bjdkabLJD'
})

await order.save()

// Create the fake data event
const data: OrderCancelledEvent['data'] = {
    id: order.id,
    version: 0,
    ticket: {
        id: 'ankhda',
    }
}
// @ts-ignore
const msg: Message = {
  ack: jest.fn()
}

return{ listener, order, data, msg}
}

it('update the status of the order', async () => {
const { listener,order, data, msg} = await setup()

await listener.onMessage(data, msg)

const updateOrder = await Order.findById(order.id)

expect(updateOrder!.status).toEqual(OrderStatus.Cancelled)
})

it('acks the message', async () => {
  const { listener, data, msg} = await setup()

  await listener.onMessage(data, msg)

  expect(msg.ack).toHaveBeenCalled()
})