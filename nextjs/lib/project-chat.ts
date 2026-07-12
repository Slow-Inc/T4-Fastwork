/** Opening question auto-sent when a visitor arrives from a project's detail page (§5.4). */
export function buildProjectGreetingMessage(title: string): string {
  return `บอกรายละเอียดเพิ่มเติมเกี่ยวกับผลงาน "${title}" หน่อยครับ`;
}
