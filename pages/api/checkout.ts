import { NextApiRequest, NextApiResponse } from "next";
import { Stripe } from "stripe";

type Res = {
  session?: Stripe.Checkout.Session;
  message?: string;
};

type LineItem = {
  price: string;
  quantity: number;
};

type Req = {
  lineItems: LineItem[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Res>,
) {
  if (req.method != "POST") {
    res.status(405).json({ message: "POST method required" });
    return;
  }

  try {
    const body: Req = JSON.parse(req.body);

    const stripe = new Stripe(process.env.STRIPE_SECRET ?? "", {
      apiVersion: "2023-08-16",
    });

    const host = req.headers.host || ""; 
    const baseUrl = `http://${host}`;

    const session = await stripe.checkout.sessions.create({
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel?session_id={CHECKOUT_SESSION_ID}`,
      line_items: body.lineItems,
      mode: "payment",
    });

    res.status(201).json({ session });
  } catch (e) {
    // @ts-ignore
    res.status(500).json({ message: e.message });
  }
}
