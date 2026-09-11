import { io } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';

const BASE_URL = 'http://localhost:5000';

async function runTest() {
  console.log('🚀 Starting Real-Time Notification End-to-End Test...');

  // 1. Connect Buyer Socket (User 11)
  const buyerSocket = io(BASE_URL, { transports: ['websocket'] });
  // 2. Connect Seller Socket (User 12, Seller 7)
  const sellerSocket = io(BASE_URL, { transports: ['websocket'] });

  const buyerEvents = [];
  const sellerEvents = [];

  buyerSocket.on('connect', () => {
    console.log('✅ Buyer Socket connected:', buyerSocket.id);
    buyerSocket.emit('join_user', 11);
  });

  sellerSocket.on('connect', () => {
    console.log('✅ Seller Socket connected:', sellerSocket.id);
    sellerSocket.emit('join_user', 12);
    sellerSocket.emit('join_seller', 7);
  });

  buyerSocket.on('new_notification', (notif) => {
    console.log('🔔 [Buyer Received]', notif.title, '-->', notif.message);
    buyerEvents.push(notif);
  });

  sellerSocket.on('new_notification', (notif) => {
    console.log('🔔 [Seller Received - user room]', notif.title, '-->', notif.message);
    sellerEvents.push(notif);
  });

  sellerSocket.on('new_order_alert', (notif) => {
    console.log('🔔 [Seller Received - seller room]', notif.title, '-->', notif.message);
    sellerEvents.push(notif);
  });

  // Wait for connections
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 3. Place Order for Product 11 (Potato, Seller 7)
  console.log('\n📦 Step 1: Placing Order by Buyer (User 11)...');
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: 11,
      items: [
        {
          id: 11,
          seller_id: 7,
          quantity: 2,
          unitPrice: 50
        }
      ],
      fulfillmentType: 'DELIVERY',
      paymentMethod: 'COD',
      deliveryAddress: 'House 4, Road 2, Dhanmondi, Dhaka',
      totalAmount: 200
    })
  });

  const orderData = await orderRes.json();
  const orderId = orderData.order.id;
  const orderNumber = orderData.order.orderNumber;
  console.log(`✅ Order Placed: ID ${orderId}, Number: ${orderNumber}`);

  // Wait for socket delivery
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 4. Seller updates status to PROCESSING
  console.log('\n🔄 Step 2: Seller updates status to PROCESSING...');
  await fetch(`${BASE_URL}/api/seller/orders/${orderId}/status?sellerId=7`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'PROCESSING' })
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 5. Seller updates status to SHIPPED
  console.log('\n🚚 Step 3: Seller updates status to SHIPPED...');
  await fetch(`${BASE_URL}/api/seller/orders/${orderId}/status?sellerId=7`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'SHIPPED' })
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 6. Buyer confirms COD payment upon delivery
  console.log('\n💰 Step 4: Buyer confirms COD Payment upon delivery...');
  await fetch(`${BASE_URL}/api/orders/${orderId}/confirm-payment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('\n📊 Summary of Events Delivered:');
  console.log(`Buyer received: ${buyerEvents.length} notifications`);
  console.log(`Seller received: ${sellerEvents.length} notifications`);

  buyerSocket.disconnect();
  sellerSocket.disconnect();

  if (buyerEvents.length >= 3 && sellerEvents.length >= 2) {
    console.log('\n🎉 ALL REAL-TIME NOTIFICATION FLOWS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    console.error('\n❌ Notification count did not match expectations.');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
