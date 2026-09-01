import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ติดต่อเรา · SUCCESS IT CENTER",
  description: "ติดต่อ SUCCESS IT CENTER เพื่อสอบถามและสั่งซื้อสินค้า",
};

// Placeholder: the cart's "ติดต่อเราเพื่อสั่งซื้อ" button lands here.
// Real contact details / form to be filled in later.
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[720px] px-5 py-16">
      <h1 className="mb-3 text-2xl font-bold text-ink">ติดต่อเรา</h1>
      <p className="text-sm text-muted-foreground">
        เร็ว ๆ นี้ — กำลังเตรียมช่องทางติดต่อสำหรับสั่งซื้อสินค้า
      </p>
    </div>
  );
}
