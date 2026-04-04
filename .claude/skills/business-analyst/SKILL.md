---
name: business-analyst
description: "**Business Analyst Pro**: Tạo proposal chuyên nghiệp, báo giá dịch vụ, PRD (Product Requirements Document), user stories, phân tích nghiệp vụ, SWOT, competitor analysis, business model canvas, và mọi tài liệu BA. MANDATORY TRIGGERS: proposal, báo giá, quotation, quote, pricing, PRD, requirements, user story, SWOT, competitor analysis, business model, phân tích, nghiệp vụ, tài liệu dự án, scope, specification, use case, flow diagram, stakeholder, gap analysis, feasibility study. Dùng skill này bất cứ khi nào user cần tạo tài liệu kinh doanh, phân tích yêu cầu, hoặc chuẩn bị tài liệu cho dự án — kể cả khi họ chỉ nói 'làm cho tôi cái proposal' hoặc 'báo giá cho khách'."
---

# Business Analyst Pro — Tài liệu & Phân tích Nghiệp vụ

Skill này giúp Claude trở thành một Business Analyst chuyên nghiệp, có khả năng tạo mọi loại tài liệu kinh doanh từ proposal đến PRD, từ báo giá đến phân tích thị trường.

## Triết lý

Tài liệu BA tốt là cầu nối giữa business và execution. Nó cần đủ chi tiết để team thực thi, đủ rõ ràng để stakeholders hiểu, và đủ thuyết phục để khách hàng tin tưởng. Mỗi tài liệu nên trả lời được: "Đọc xong, người nhận biết chính xác phải làm gì tiếp theo."

## Các loại tài liệu và quy trình

### 1. PROPOSAL — Đề xuất dự án / Giới thiệu dịch vụ

Proposal là tài liệu bán hàng bậc cao — nó phải vừa chuyên nghiệp vừa thuyết phục.

#### Cấu trúc proposal chuẩn:

```
1. COVER PAGE
   - Logo công ty
   - Tên dự án / dịch vụ
   - Tên khách hàng
   - Ngày tạo
   - Version

2. MỤC LỤC (nếu > 5 trang)

3. EXECUTIVE SUMMARY
   - Tóm tắt vấn đề khách hàng đang gặp
   - Giải pháp đề xuất (2-3 câu)
   - Giá trị mang lại (ROI, tiết kiệm thời gian, tăng hiệu quả)

4. VỀ CHÚNG TÔI
   - Giới thiệu công ty
   - Năng lực và kinh nghiệm
   - Đội ngũ chính
   - Thành tựu nổi bật / Case studies

5. HIỂU VỀ NHU CẦU
   - Bối cảnh / Pain points của khách
   - Phân tích tình hình hiện tại
   - Mục tiêu mong muốn

6. GIẢI PHÁP ĐỀ XUẤT
   - Mô tả giải pháp chi tiết
   - Tính năng / Phạm vi công việc
   - Công nghệ sử dụng (nếu IT)
   - Phương pháp triển khai

7. TIMELINE & MILESTONES
   - Gantt chart hoặc timeline visual
   - Các phase / sprint
   - Deliverables cho từng phase

8. ĐỘI NGŨ DỰ ÁN
   - Roles và trách nhiệm
   - Profile ngắn của key members

9. BÁO GIÁ (có thể tách riêng)
   - Bảng giá chi tiết
   - Các gói lựa chọn (nếu có)
   - Điều khoản thanh toán

10. ĐIỀU KHOẢN & ĐIỀU KIỆN
    - Phạm vi, ngoài phạm vi
    - Warranty / Support
    - Bảo mật thông tin

11. BƯỚC TIẾP THEO
    - Call to action rõ ràng
    - Thông tin liên hệ
    - Timeline quyết định
```

#### Tips viết proposal thuyết phục:
- Dùng ngôn ngữ của khách (nếu viết cho doanh nghiệp Nhật → formal, kính ngữ)
- Nêu rõ benefit chứ không chỉ feature
- Dùng số liệu cụ thể: "giảm 40% thời gian xử lý" thay vì "tăng hiệu quả"
- Visual > Text: Dùng diagrams, charts, icons khi có thể
- Mỗi section nên answer: "Tại sao khách nên chọn chúng tôi?"

### 2. BÁO GIÁ — Quotation

Báo giá cần rõ ràng, dễ so sánh, và truyền tải giá trị.

#### Cấu trúc báo giá:

```
HEADER:
  - Logo công ty + thông tin liên hệ
  - Số báo giá (QT-YYYY-XXX)
  - Ngày tạo & Ngày hết hạn
  - Tên khách hàng & người liên hệ

BẢNG GIÁ CHI TIẾT:
  | STT | Hạng mục | Mô tả | Đơn vị | Số lượng | Đơn giá | Thành tiền |
  Subtotal
  VAT (nếu có)
  TỔNG CỘNG

CÁC GÓI DỊCH VỤ (nếu có):
  | Feature          | Basic | Standard | Premium |
  | Tính năng A      | ✓     | ✓        | ✓       |
  | Tính năng B      | ✗     | ✓        | ✓       |
  | Hỗ trợ           | Email | Phone    | 24/7    |
  | Giá              | X     | Y        | Z       |
  Highlight gói recommended

ĐIỀU KHOẢN:
  - Thời hạn báo giá (thường 15-30 ngày)
  - Điều khoản thanh toán (30/40/30 hoặc theo milestone)
  - Bao gồm / Không bao gồm
  - Warranty & support

NOTES:
  - Giá chưa bao gồm VAT (nếu cần)
  - Thay đổi scope có thể ảnh hưởng giá
```

#### Format output:
- **HTML**: Báo giá đẹp, in được, dùng cho email/web → dùng skill uiux-pro-max kết hợp
- **DOCX**: Báo giá formal cho doanh nghiệp → dùng skill docx kết hợp
- **PDF**: Báo giá final không chỉnh sửa → dùng skill pdf kết hợp
- **XLSX**: Báo giá có formula tính toán → dùng skill xlsx kết hợp

### 3. PRD — Product Requirements Document

PRD là tài liệu kỹ thuật mô tả sản phẩm cần xây dựng.

#### Cấu trúc PRD:

```
1. OVERVIEW
   - Product name
   - Version
   - Author & Date
   - Status (Draft / Review / Approved)

2. PROBLEM STATEMENT
   - Bối cảnh
   - Vấn đề cần giải quyết
   - Impact nếu không giải quyết

3. GOALS & SUCCESS METRICS
   - Business goals (OKRs)
   - User goals
   - KPIs đo lường thành công

4. USER PERSONAS
   - Persona 1: Name, demographics, goals, pain points
   - Persona 2: ...
   - Primary vs Secondary users

5. USER STORIES & REQUIREMENTS
   - Epic → User Stories → Acceptance Criteria
   Format: "As a [role], I want [action] so that [benefit]"

   Acceptance Criteria format:
   - Given [context]
   - When [action]
   - Then [expected result]

6. FUNCTIONAL REQUIREMENTS
   - Feature list with priority (Must/Should/Could/Won't)
   - Detailed specs per feature
   - Business rules

7. NON-FUNCTIONAL REQUIREMENTS
   - Performance (load time, concurrent users)
   - Security (authentication, data protection)
   - Scalability
   - Accessibility
   - Compliance

8. INFORMATION ARCHITECTURE
   - Sitemap
   - User flows
   - Navigation structure

9. WIREFRAMES / MOCKUPS
   - Key screens (nếu cần, kết hợp skill uiux-pro-max)
   - Interactive states
   - Error states

10. DATA MODEL
    - Entity Relationship Diagram
    - Data dictionary
    - API specs (nếu có)

11. DEPENDENCIES & CONSTRAINTS
    - Technical dependencies
    - Third-party integrations
    - Timeline constraints
    - Budget constraints

12. TIMELINE & PHASES
    - Phase breakdown
    - Milestones
    - Release plan

13. RISKS & MITIGATIONS
    - Risk matrix (probability × impact)
    - Mitigation strategies

14. APPENDIX
    - Glossary
    - References
    - Change log
```

### 4. PHÂN TÍCH NGHIỆP VỤ

#### SWOT Analysis
```
┌─────────────────┬─────────────────┐
│   STRENGTHS     │   WEAKNESSES    │
│   (Nội bộ +)    │   (Nội bộ -)    │
├─────────────────┼─────────────────┤
│  OPPORTUNITIES  │    THREATS      │
│   (Bên ngoài +) │   (Bên ngoài -) │
└─────────────────┴─────────────────┘
```

#### Competitor Analysis
```
| Tiêu chí        | Chúng ta | Đối thủ A | Đối thủ B |
|-----------------|----------|-----------|-----------|
| Giá             | ★★★★☆   | ★★★☆☆    | ★★★★★     |
| Chất lượng      | ★★★★★   | ★★★★☆    | ★★★☆☆    |
| Hỗ trợ          | ★★★★☆   | ★★☆☆☆    | ★★★☆☆    |
| USP             | ...      | ...       | ...       |
```

#### Business Model Canvas
```
┌──────────┬───────────┬──────────┬──────────┬──────────┐
│ Key      │ Key       │ Value    │ Customer │ Customer │
│ Partners │ Activities│ Proposi- │ Relation-│ Segments │
│          │           │ tions    │ ships    │          │
│          ├───────────┤          ├──────────┤          │
│          │ Key       │          │ Channels │          │
│          │ Resources │          │          │          │
├──────────┴───────────┼──────────┴──────────┴──────────┤
│ Cost Structure       │ Revenue Streams                 │
└──────────────────────┴─────────────────────────────────┘
```

### 5. Quy tắc chung cho mọi tài liệu BA

#### Ngôn ngữ
- Tùy ngữ cảnh: Tiếng Việt, Nhật, Anh, hoặc song ngữ
- Formal khi viết cho doanh nghiệp Nhật (敬語 / keigo)
- Clear & concise — tránh jargon không cần thiết
- Active voice: "Hệ thống sẽ gửi email" thay vì "Email sẽ được gửi bởi hệ thống"

#### Visual Elements
- Dùng tables cho so sánh và dữ liệu có cấu trúc
- Dùng diagrams cho flows và relationships
- Dùng charts cho data (kết hợp skill xlsx nếu cần)
- Icons/emoji cho status và priority (✅ ⚠️ ❌ 🔴 🟡 🟢)

#### Versioning
- Mỗi tài liệu nên có version number
- Change log cho major revisions
- Draft → Review → Approved workflow

#### Output Formats
Chọn format phù hợp nhất với mục đích:
- **HTML**: Preview nhanh, chia sẻ online, responsive
- **DOCX**: Tài liệu formal, cần chỉnh sửa thêm → kết hợp skill docx
- **PDF**: Tài liệu final, gửi khách hàng → kết hợp skill pdf
- **PPTX**: Presentation cho stakeholders → kết hợp skill pptx
- **XLSX**: Data-heavy analysis, báo giá có formula → kết hợp skill xlsx

Khi user không chỉ rõ format, hỏi ngắn hoặc chọn format phù hợp nhất:
- Proposal/Báo giá → PDF hoặc DOCX
- PRD → DOCX hoặc Markdown
- Analysis → HTML hoặc XLSX
- Presentation → PPTX

### 6. Templates & Patterns

Khi tạo tài liệu, tuân theo pattern này:

1. **Header**: Logo, tên công ty, thông tin cơ bản
2. **Table of Contents**: Cho tài liệu > 3 trang
3. **Executive Summary**: Luôn có ở đầu (1 paragraph)
4. **Body**: Nội dung chính, chia sections rõ ràng
5. **Next Steps**: Luôn kết thúc bằng action items
6. **Contact**: Thông tin liên hệ + CTA

Mỗi section nên bắt đầu bằng 1-2 câu tóm tắt trước khi đi vào chi tiết.
