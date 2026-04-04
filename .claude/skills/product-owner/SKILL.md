---
name: product-owner
description: "**Product Owner Pro**: Quản lý sản phẩm toàn diện — tạo interactive demo/prototype, product roadmap, sprint planning, backlog management, release notes, stakeholder communication (slide deck, status report, demo script, meeting notes). MANDATORY TRIGGERS: demo, prototype, roadmap, backlog, sprint, release, product planning, stakeholder, status report, demo script, meeting notes, MVP, feature prioritization, user feedback, iteration, agile, scrum, kanban, epic, milestone, go-to-market. Dùng skill này khi user cần quản lý sản phẩm, tạo demo cho khách hàng, lên kế hoạch phát triển, hoặc chuẩn bị tài liệu communication — kể cả khi họ chỉ nói 'làm demo cho tôi' hoặc 'show cho khách cái này'."
---

# Product Owner Pro — Quản lý Sản phẩm & Demo

Skill này giúp Claude hoạt động như một Product Owner chuyên nghiệp, từ việc tạo interactive demo cho khách hàng đến quản lý roadmap và communication với stakeholders.

## Triết lý

Product Owner là người kết nối tầm nhìn sản phẩm với thực thi. Mỗi output cần trả lời 3 câu hỏi: "Chúng ta đang xây gì?" (Vision), "Tại sao?" (Value), và "Khi nào?" (Timeline). Demo không chỉ là show tính năng — nó kể câu chuyện về giá trị sản phẩm mang lại.

## 1. INTERACTIVE DEMO & PROTOTYPE

### Mức độ prototype

Chọn mức phù hợp với mục đích:

| Level | Khi nào dùng | Công cụ |
|-------|-------------|---------|
| **Wireframe** | Ý tưởng ban đầu, internal discussion | HTML đơn giản, grayscale |
| **Lo-fi Prototype** | Validate flow, user testing sớm | HTML + basic CSS, clickable |
| **Hi-fi Prototype** | Pitch khách, demo stakeholder | HTML + CSS + JS, animation |
| **Interactive Demo** | Sales demo, investor pitch | Full HTML app, fake data, transitions |

### Tạo Interactive Demo (HTML)

Khi tạo demo dạng interactive prototype:

```
Cấu trúc demo:
1. Welcome / Splash screen
2. Main flow — happy path (3-5 screens)
3. Key interactions (click, hover, transitions)
4. Summary / CTA screen
```

#### Nguyên tắc demo hiệu quả:

1. **Realistic data**: Dùng data giống thật, không "Lorem ipsum"
   - Tên người Việt/Nhật thật
   - Số liệu hợp lý
   - Ảnh/icon phù hợp ngành

2. **Happy path first**: Demo luôn chạy suôn sẻ
   - Không show error states (trừ khi demo tính năng xử lý lỗi)
   - Pre-fill forms với data mẫu
   - Smooth transitions giữa các bước

3. **Guided experience**: Dẫn dắt người xem
   - Highlight nút/area cần click (pulse animation, arrow)
   - Progress indicator cho multi-step flows
   - Tooltip giải thích khi hover

4. **Storytelling**: Kể chuyện qua demo
   - Bắt đầu bằng pain point: "Hiện tại khách hàng phải..."
   - Giải pháp: "Với hệ thống mới, chỉ cần..."
   - Kết quả: "Giảm 50% thời gian xử lý"

#### Demo Navigation Pattern

```html
<!-- Multi-screen demo navigation -->
<div class="demo-container">
  <div class="demo-progress">
    <span class="step active">1. Đăng ký</span>
    <span class="step">2. Chọn dịch vụ</span>
    <span class="step">3. Thanh toán</span>
    <span class="step">4. Hoàn tất</span>
  </div>

  <div class="demo-screens">
    <section class="screen active" id="screen-1">...</section>
    <section class="screen" id="screen-2">...</section>
    <section class="screen" id="screen-3">...</section>
  </div>

  <div class="demo-controls">
    <button class="btn-prev">← Quay lại</button>
    <button class="btn-next">Tiếp tục →</button>
  </div>
</div>
```

#### Animations cho Demo

```css
/* Screen transitions */
.screen {
  opacity: 0;
  transform: translateX(30px);
  transition: all 0.4s ease;
  display: none;
}
.screen.active {
  opacity: 1;
  transform: translateX(0);
  display: block;
}

/* Highlight clickable elements */
@keyframes pulse-highlight {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
}
.demo-highlight { animation: pulse-highlight 2s infinite; }

/* Number counter animation */
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Demo Script — Kịch bản trình bày

Khi tạo demo script, format như sau:

```
DEMO SCRIPT: [Tên sản phẩm]
Thời lượng: X phút
Đối tượng: [Ai sẽ xem]
Mục tiêu: [Demo muốn đạt được gì]

---

[SLIDE/SCREEN 1] - Giới thiệu (1 phút)
• Nói: "Chào mừng các anh/chị đến với demo..."
• Hành động: Mở trang chủ
• Key point: Nêu bối cảnh vấn đề

[SLIDE/SCREEN 2] - Pain Point (2 phút)
• Nói: "Hiện tại, quy trình đang..."
• Hành động: Show biểu đồ before/after
• Key point: Số liệu impact

[SLIDE/SCREEN 3] - Giải pháp (3 phút)
• Nói: "Với hệ thống mới..."
• Hành động: Live demo flow
• Key point: Highlight tính năng chính

...

[Q&A] - Hỏi đáp (5 phút)
• Câu hỏi dự kiến + câu trả lời gợi ý
```

## 2. PRODUCT ROADMAP

### Roadmap Formats

#### Timeline Roadmap (phổ biến nhất)
```
Q1 2026          Q2 2026          Q3 2026          Q4 2026
────────────────────────────────────────────────────────────
[  MVP Launch  ] [  Feature Set 2  ] [  Scale & Grow  ] [ Enterprise ]
  - Landing page   - User dashboard    - API integration  - White label
  - Basic flow     - Payment           - Analytics        - Multi-tenant
  - Admin panel    - Notifications     - Mobile app       - Marketplace
```

#### Theme-based Roadmap
```
NOW (đang làm)     NEXT (sắp tới)     LATER (tương lai)
──────────────────  ──────────────────  ──────────────────
Core Features       Enhancement         Scale
- Feature A         - Feature D         - Feature G
- Feature B         - Feature E         - Feature H
- Feature C         - Feature F         - Feature I
```

#### Output dạng HTML
Khi tạo roadmap dạng visual, tạo HTML interactive:
- Gantt-style timeline với color-coded phases
- Hover để xem chi tiết
- Filter theo team/priority
- Responsive cho mobile viewing
- Kết hợp skill uiux-pro-max cho design đẹp

### Roadmap Best Practices
- Không commit date cụ thể cho items xa (dùng Q1, Q2 thay vì ngày)
- Phân loại: Must Have / Should Have / Nice to Have
- Liên kết mỗi item với business goal
- Review và update monthly

## 3. SPRINT PLANNING & BACKLOG

### Product Backlog Template

```
| Priority | Epic        | User Story                          | Points | Sprint | Status    |
|----------|-------------|-------------------------------------|--------|--------|-----------|
| P0       | Auth        | Đăng ký tài khoản bằng email       | 5      | S1     | Done ✅   |
| P0       | Auth        | Đăng nhập / Đăng xuất              | 3      | S1     | Done ✅   |
| P1       | Dashboard   | Xem tổng quan dịch vụ              | 8      | S2     | In Progress 🔄 |
| P1       | Payment     | Thanh toán online                   | 13     | S3     | Planned 📋 |
| P2       | Notification| Email reminder                      | 3      | S3     | Planned 📋 |
```

### Sprint Planning Output

```
SPRINT [N]: [Tên Sprint]
Duration: [Start] → [End] (2 weeks)
Goal: [Sprint goal - 1 câu]
Capacity: [X] story points

COMMITTED ITEMS:
├── [Epic] User Story 1 (X pts) — @assignee
├── [Epic] User Story 2 (Y pts) — @assignee
├── [Epic] User Story 3 (Z pts) — @assignee
└── Total: [sum] pts

RISKS & DEPENDENCIES:
- Risk: [description] → Mitigation: [plan]
- Dependency: [item] blocks [item]

DEFINITION OF DONE:
- Code reviewed
- Tests passing
- Deployed to staging
- PO accepted
```

## 4. STAKEHOLDER COMMUNICATION

### Status Report (Weekly/Bi-weekly)

```
STATUS REPORT — [Project Name]
Period: [Date range]
Overall Status: 🟢 On Track / 🟡 At Risk / 🔴 Blocked

HIGHLIGHTS:
- Completed [feature X] ahead of schedule
- Successfully integrated [system Y]

PROGRESS:
| Milestone          | Target    | Status  | Notes           |
|--------------------|-----------|---------|-----------------|
| Phase 1 - MVP      | Mar 2026  | 🟢 Done | Launched Mar 15 |
| Phase 2 - Features | Apr 2026  | 🟡 80%  | Payment delayed |
| Phase 3 - Scale    | Jun 2026  | 📋 0%   | Not started     |

BLOCKERS:
- [Blocker description] → [Owner] → [ETA to resolve]

NEXT WEEK:
- [ ] Complete payment integration
- [ ] Start user testing
- [ ] Design review for mobile

DECISIONS NEEDED:
- Should we prioritize X over Y? (need answer by [date])
```

### Meeting Notes Template

```
MEETING NOTES
Date: [Date]
Attendees: [Names]
Type: [Sprint Review / Planning / Stakeholder / Retro]

AGENDA:
1. [Topic]
2. [Topic]

DISCUSSION:
[Topic 1]:
- Key points discussed
- Decisions made
- Open questions

ACTION ITEMS:
| # | Action                | Owner    | Due Date   | Status |
|---|----------------------|----------|------------|--------|
| 1 | [Action description] | [Name]   | [Date]     | Open   |
| 2 | [Action description] | [Name]   | [Date]     | Open   |

NEXT MEETING: [Date, Time]
```

### Release Notes

```
RELEASE NOTES — v[X.Y.Z]
Release Date: [Date]

🎉 NEW FEATURES
- [Feature]: [1-line description of what users can now do]
- [Feature]: [1-line description]

🔧 IMPROVEMENTS
- [Improvement]: [What got better and why users care]

🐛 BUG FIXES
- Fixed [issue] that caused [problem]

⚠️ KNOWN ISSUES
- [Issue]: [Workaround if available]

📋 MIGRATION NOTES (if applicable)
- [What users/devs need to do]
```

## 5. PRESENTATION & SLIDE DECK

Khi cần tạo presentation cho stakeholders, kết hợp skill pptx:

### Slide Structures phổ biến:

**Product Update Deck (10-15 slides)**
1. Title + Date
2. Agenda
3. Sprint/Quarter Highlights (3-4 slides)
4. Demo Screenshots/GIFs
5. Metrics & KPIs
6. Roadmap Update
7. Risks & Blockers
8. Ask/Decisions Needed
9. Q&A

**Product Pitch Deck (8-12 slides)**
1. Cover
2. Problem
3. Solution
4. Demo / How it works
5. Market size
6. Business model
7. Traction / Metrics
8. Team
9. Ask (funding/partnership)
10. Contact

## 6. Quy tắc chung

### Ngôn ngữ
- Tùy ngữ cảnh tự động chọn ngôn ngữ phù hợp
- Demo cho khách Nhật: tiếng Nhật formal hoặc song ngữ
- Internal: tiếng Việt hoặc tiếng Anh tùy team
- Investor/Partner: tiếng Anh hoặc tiếng Nhật

### Output Format
- **Demo/Prototype**: HTML interactive (single file)
- **Roadmap visual**: HTML hoặc Mermaid
- **Backlog**: XLSX (kết hợp skill xlsx)
- **Status Report**: DOCX hoặc Markdown
- **Meeting Notes**: Markdown
- **Release Notes**: Markdown
- **Presentation**: PPTX (kết hợp skill pptx)

### Collaboration Notes
Skill này kết hợp tốt với các skills khác:
- **uiux-pro-max**: Khi demo cần design đẹp, responsive
- **business-analyst**: Khi cần PRD, analysis đi kèm demo
- **docx/pdf**: Khi output là tài liệu formal
- **pptx**: Khi cần slide deck
- **xlsx**: Khi cần backlog, data tracking
