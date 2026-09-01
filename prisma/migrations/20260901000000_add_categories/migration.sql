-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "th" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'dome',
    "gradient" TEXT NOT NULL DEFAULT 'linear-gradient(135deg,#5EE7D3,#2F6BFF)',
    "sub" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- Backfill: the five categories that used to be hardcoded in lib/products.ts.
-- Product.type already stores these slugs, so the storefront keeps working.
INSERT INTO "Category" ("slug", "th", "en", "icon", "gradient", "sub", "sort", "updatedAt") VALUES
  ('cctv',   'กล้องวงจรปิด',    'CCTV Cameras', 'dome',   'linear-gradient(135deg,#5EE7D3,#2F6BFF)', 'กล้อง CCTV ความละเอียดสูง มองเห็นกลางคืน พร้อมฟีเจอร์ AI วางกล้อง', 0, CURRENT_TIMESTAMP),
  ('sensor', 'เซ็นเซอร์',        'Sensors',      'sensor', 'linear-gradient(135deg,#2F6BFF,#5EE7D3)', 'เซ็นเซอร์ตรวจจับไร้สาย แจ้งเตือนทันทีเมื่อมีความเคลื่อนไหว',        1, CURRENT_TIMESTAMP),
  ('alarm',  'สัญญาณกันขโมย',  'Alarms',       'alarm',  'linear-gradient(135deg,#5EE7D3,#2F6BFF)', 'ไซเรนและระบบแจ้งเตือนเสียงดัง ป้องกันการบุกรุก',                     2, CURRENT_TIMESTAMP),
  ('lock',   'สมาร์ทล็อค',       'Smart Locks',  'lock',   'linear-gradient(135deg,#2F6BFF,#5EE7D3)', 'ล็อกอัจฉริยะ ปลดล็อกด้วยลายนิ้วมือและแอปพลิเคชัน',                  3, CURRENT_TIMESTAMP),
  ('nvr',    'ชุด NVR',           'NVR Kits',     'nvr',    'linear-gradient(135deg,#5EE7D3,#2F6BFF)', 'ชุดบันทึกภาพครบชุด พร้อมฮาร์ดดิสก์และการติดตั้ง',                    4, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
