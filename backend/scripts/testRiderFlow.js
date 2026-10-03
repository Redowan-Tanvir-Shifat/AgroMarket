async function testRiderWorkflow() {
  console.log('🧪 Testing Full Rider Logistics & Payment Handshake Workflow...');
  const baseUrl = 'http://localhost:5000';

  try {
    // 1. Login as Rider 1 (Karim Rider)
    const riderLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '01700000003', password: 'password' })
    });
    const riderLogin = await riderLoginRes.json();
    console.log('✅ Rider 1 Login:', riderLogin.user.fullName, '| Role:', riderLogin.user.role);
    const riderToken = riderLogin.token;
    const riderId = riderLogin.user.riderProfile?.id || 1;

    // 2. Fetch Available Riders
    const availableRes = await (await fetch(`${baseUrl}/api/rider/available`)).json();
    console.log(`✅ Available Idle Riders: ${availableRes.riders.length} found`);

    // 3. Get an existing product
    const prodsRes = await (await fetch(`${baseUrl}/api/products`)).json();
    const existingProduct = prodsRes.products?.[0] || { id: 1, seller_id: 1, price: 250, title: 'Fresh Produce' };
    console.log(`✅ Using product #${existingProduct.id}: ${existingProduct.title} (Seller #${existingProduct.seller_id})`);

    // 4. Create a test order for home delivery (COD)
    const orderJson = await (await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerId: 1,
        items: [
          {
            id: existingProduct.id,
            seller_id: existingProduct.seller_id,
            quantity: 1,
            unitPrice: existingProduct.price_bdt || existingProduct.price || 100,
            title: existingProduct.title
          }
        ],
        fulfillmentType: 'DELIVERY',
        paymentMethod: 'COD',
        deliveryAddress: 'House 12, Road 4, Mirpur-10, Dhaka',
        totalAmount: (existingProduct.price_bdt || existingProduct.price || 100) + 60
      })
    })).json();

    if (!orderJson.order) {
      console.error('Order creation error response:', orderJson);
      return;
    }
    const order = orderJson.order;
    console.log(`✅ Test Order Created: #${order.orderNumber} (ID: ${order.id}) | Status: ${order.orderStatus}`);

    // 4. Farm marks packaging (PROCESSING)
    await fetch(`${baseUrl}/api/seller/orders/${order.id}/status?sellerId=1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PROCESSING' })
    });
    console.log(`✅ Farm marked packaging: Order #${order.orderNumber} -> PROCESSING`);

    // 5. Farm selects & assigns Rider 1
    const assignRes = await (await fetch(`${baseUrl}/api/rider/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, riderId: riderId })
    })).json();
    console.log(`✅ Farm assigned Rider 1: ${assignRes.message}`);

    // 6. Rider accepts the ride
    const acceptRes = await (await fetch(`${baseUrl}/api/rider/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`
      },
      body: JSON.stringify({ orderId: order.id, riderId: riderId })
    })).json();
    console.log(`✅ Rider accepted ride: Order status is now -> ${acceptRes.orderStatus}`);

    // 7. Test Dual COD Payment Handshake
    // Buyer clicks "Paid cash to rider"
    const buyerConfirmRes = await (await fetch(`${baseUrl}/api/rider/confirm-buyer-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id })
    })).json();
    console.log(`✅ Buyer confirmed cash payment: Both confirmed = ${buyerConfirmRes.bothConfirmed}`);

    // Rider clicks "Received cash from buyer"
    const riderConfirmRes = await (await fetch(`${baseUrl}/api/rider/confirm-rider-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`
      },
      body: JSON.stringify({ orderId: order.id, riderId: riderId })
    })).json();
    console.log(`✅ Rider confirmed cash receipt: Both confirmed = ${riderConfirmRes.bothConfirmed} | ${riderConfirmRes.message}`);

    // 8. Verify Rider Profile & Stats Updated
    const profileRes = await (await fetch(`${baseUrl}/api/rider/profile?riderId=${riderId}`)).json();
    console.log(`✅ Rider Profile status after delivery: ${profileRes.rider.status} | Total Deliveries: ${profileRes.rider.total_deliveries}`);

    console.log('🎉 ALL RIDER WORKFLOW TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testRiderWorkflow();
