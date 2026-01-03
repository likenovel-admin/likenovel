export async function POST(request: Request) {
  const { paymentId, txId } = await request.json();

  console.log("paymentId", paymentId);
  console.log("txId", txId);

  if (!paymentId || !txId) {
    return new Response(JSON.stringify({
      message: "결제 정보가 올바르지 않습니다",
      data: null
    }), {
      status: 400
    });
  }

  return new Response(JSON.stringify({
    message: "",
    data: {
      paymentId,
      txId,
      status: "SUCCESS"
    }
  }));
}