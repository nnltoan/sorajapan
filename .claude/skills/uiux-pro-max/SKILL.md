---
name: uiux-pro-max
description: "**UI/UX Design Pro Max**: Comprehensive web design skill for creating stunning, conversion-optimized landing pages, full UI/UX design systems, responsive layouts, wireframes, mockups, and interactive prototypes using HTML/CSS/JS. Use this skill whenever the user mentions: website design, landing page, UI, UX, wireframe, mockup, prototype, responsive design, hero section, CTA, conversion optimization, design system, component library, style guide, color palette, typography, animations, web layout, page template, hoặc bất kỳ yêu cầu nào liên quan đến thiết kế giao diện web — kể cả khi họ không nói rõ 'UI/UX'. Nếu user muốn tạo hoặc cải thiện trang web, hãy dùng skill này."
---

# UI/UX PRO MAX — Web Design Mastery

Skill này giúp Claude trở thành một UI/UX Designer chuyên nghiệp, có khả năng thiết kế web từ concept đến implementation. Mục tiêu là tạo ra các trang web đẹp, chuyên nghiệp, tối ưu chuyển đổi và hoạt động mượt mà trên mọi thiết bị.

## Triết lý thiết kế

Thiết kế tốt không chỉ là đẹp — nó phải giải quyết vấn đề. Mỗi element trên trang đều có lý do tồn tại: dẫn dắt ánh mắt người dùng, truyền tải thông điệp, hoặc thúc đẩy hành động. Khi thiết kế, luôn tự hỏi: "Element này giúp user đạt được mục tiêu gì?"

## Quy trình làm việc

### 1. Discovery — Hiểu bài toán

Trước khi viết một dòng code nào, cần hiểu rõ:

- **Đối tượng mục tiêu**: Ai sẽ xem trang này? Độ tuổi, nghề nghiệp, nhu cầu?
- **Mục tiêu chuyển đổi**: User cần làm gì sau khi vào trang? (đăng ký, liên hệ, mua hàng?)
- **Tone & Voice**: Chuyên nghiệp, thân thiện, sang trọng, hay năng động?
- **Thương hiệu**: Logo, màu sắc, font chữ hiện có?
- **Đối thủ**: Trang web tương tự trên thị trường trông như thế nào?

Nếu user không cung cấp đủ thông tin, hãy hỏi ngắn gọn. Nhưng đừng hỏi quá nhiều — hãy đưa ra đề xuất dựa trên best practices và để user phản hồi.

### 2. Design System — Xây dựng nền tảng

Mỗi project cần một design system nhất quán:

#### Color Palette
```
Primary:    #XXXXXX — Màu chủ đạo, dùng cho CTA, links, accent
Secondary:  #XXXXXX — Màu phụ, dùng cho section backgrounds, badges
Accent:     #XXXXXX — Điểm nhấn, dùng tiết kiệm
Dark:       #XXXXXX — Text chính, headings
Light:      #XXXXXX — Backgrounds, borders nhẹ
White:      #FFFFFF — Nền chính
```

Nguyên tắc: Tối đa 3-4 màu chính. Dùng tints/shades (opacity hoặc lighten/darken) để tạo biến thể. Đảm bảo contrast ratio ≥ 4.5:1 cho text.

#### Typography Scale
```
Hero:       3rem-4rem (48-64px), font-weight: 800
H1:         2.5rem (40px), font-weight: 700
H2:         2rem (32px), font-weight: 700
H3:         1.5rem (24px), font-weight: 600
Body:       1rem (16px), font-weight: 400, line-height: 1.6-1.8
Small:      0.875rem (14px)
Caption:    0.75rem (12px)
```

Font recommendations:
- **Tiếng Việt/Nhật**: Noto Sans JP, Noto Sans Vietnamese — hỗ trợ cả 2 ngôn ngữ
- **Headings nổi bật**: Montserrat, Poppins, Raleway
- **Body dễ đọc**: Inter, Open Sans, Source Sans Pro
- Load từ Google Fonts, tối đa 2-3 font families

#### Spacing System (8px grid)
```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
4xl: 80px  (5rem)
5xl: 120px (7.5rem)
```

Section padding nên từ 80px-120px vertical để tạo "breathing room". Đừng nhồi nhét content.

### 3. Layout Patterns — Cấu trúc trang

#### Landing Page Structure (đã được chứng minh hiệu quả)

```
┌─────────────────────────────────┐
│         NAVIGATION              │  Fixed/sticky, transparent → solid on scroll
├─────────────────────────────────┤
│         HERO SECTION            │  Full viewport hoặc 80vh minimum
│  Headline + Sub + CTA + Visual  │  Video background hoặc ảnh chất lượng cao
├─────────────────────────────────┤
│      SOCIAL PROOF / STATS       │  Logos đối tác, con số ấn tượng
├─────────────────────────────────┤
│         SERVICES/FEATURES       │  Cards hoặc grid layout
├─────────────────────────────────┤
│         HOW IT WORKS            │  Steps 1-2-3, timeline
├─────────────────────────────────┤
│        TESTIMONIALS             │  Carousel hoặc grid
├─────────────────────────────────┤
│          CTA SECTION            │  Lặp lại CTA chính
├─────────────────────────────────┤
│           FAQ                   │  Accordion
├─────────────────────────────────┤
│          FOOTER                 │  Links, contact, social, copyright
└─────────────────────────────────┘
```

#### Responsive Breakpoints
```css
/* Mobile First */
Default:     Mobile (< 640px)
sm:          ≥ 640px  (large phone / small tablet)
md:          ≥ 768px  (tablet)
lg:          ≥ 1024px (laptop)
xl:          ≥ 1280px (desktop)
2xl:         ≥ 1536px (large desktop)
```

Container max-width: 1200px-1400px, centered với auto margins.

### 4. Component Patterns — Chi tiết từng phần

#### Navigation
- Logo bên trái, menu items bên phải
- Mobile: hamburger menu → slide-in panel hoặc full-screen overlay
- Sticky header: thêm shadow và background khi scroll
- CTA button nổi bật trong nav (màu khác, border-radius)

```css
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  transition: background 0.3s, box-shadow 0.3s;
}
.navbar.scrolled {
  background: rgba(255,255,255,0.98);
  box-shadow: 0 2px 20px rgba(0,0,0,0.08);
}
```

#### Hero Section
- Headline: Ngắn gọn, nêu rõ giá trị (max 10 từ)
- Subheadline: Giải thích thêm (1-2 câu)
- CTA primary + CTA secondary (ghost button)
- Visual: Ảnh/video bên phải hoặc background
- Trust badges ngay dưới CTA

#### Cards
```css
.card {
  background: white;
  border-radius: 12px-16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  transition: transform 0.3s, box-shadow 0.3s;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
}
```

#### Buttons
```css
.btn-primary {
  padding: 14px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s;
  cursor: pointer;
}
/* Hover: lighten hoặc darken 10%, scale(1.02) */
/* Active: scale(0.98) */
/* Large CTA: padding 18px 40px, font-size 1.125rem */
```

### 5. Animation & Interaction

#### Scroll Animations (Intersection Observer)
Các elements nên fade-in khi scroll vào viewport — nhưng tinh tế, không quá phô trương.

```javascript
// Pattern: Observe elements và thêm class khi visible
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});
```

Animation classes phổ biến:
- `fade-up`: opacity 0 → 1, translateY(30px) → 0
- `fade-in`: opacity 0 → 1
- `slide-left/right`: translateX(±50px) → 0
- `scale-in`: scale(0.9) → 1

Duration: 0.6s-0.8s. Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` hoặc `ease-out`. Stagger delay giữa các items: 0.1s-0.15s.

#### Micro-interactions
- Button hover: color shift + slight scale
- Card hover: lift effect (translateY + shadow)
- Link hover: underline animation (width 0 → 100%)
- Input focus: border-color change + subtle glow
- Smooth scroll cho anchor links

### 6. Performance & Best Practices

#### Images
- Dùng WebP format khi có thể, fallback JPG/PNG
- Lazy loading: `loading="lazy"` cho images below the fold
- Responsive images: `srcset` cho different viewport sizes
- Decorative images: CSS background thay vì `<img>`
- Max quality for hero: dưới 200KB nếu có thể

#### CSS Architecture
- Mobile-first approach (min-width media queries)
- CSS Custom Properties cho theming
- BEM naming hoặc utility-first approach
- Tránh `!important` — fix specificity thay vì override
- Group related properties

#### Accessibility
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Alt text cho images có ý nghĩa
- Focus states rõ ràng cho keyboard navigation
- Color contrast đạt WCAG AA (4.5:1 cho text)
- `aria-label` cho interactive elements không có text
- Skip to content link

#### SEO Basics
- Một `<h1>` duy nhất per page
- Meta title ≤ 60 chars, meta description ≤ 160 chars
- Open Graph tags cho social sharing
- Structured data (JSON-LD) nếu phù hợp
- Semantic heading hierarchy (h1 → h2 → h3, không skip)

### 7. Quy tắc khi tạo file HTML

Khi tạo trang web dưới dạng single HTML file:

1. **Inline everything**: CSS trong `<style>`, JS trong `<script>` — một file duy nhất
2. **Google Fonts**: Load qua `<link>` trong `<head>`
3. **Icons**: Dùng inline SVG hoặc Font Awesome CDN, Lucide Icons CDN
4. **Images**: Dùng placeholder URLs (unsplash, picsum) hoặc SVG illustrations
5. **Responsive**: Test tại 375px, 768px, 1024px, 1440px
6. **Dark mode ready**: Dùng CSS custom properties để dễ switch
7. **Smooth scroll**: `html { scroll-behavior: smooth; }`
8. **Print-friendly**: Ẩn nav/footer khi in

### 8. Conversion Optimization

- **Above the fold**: Headline + CTA phải visible không cần scroll
- **F-pattern / Z-pattern**: Đặt content quan trọng theo eye-tracking pattern
- **Social proof**: Đặt gần CTA — testimonials, ratings, số liệu
- **Urgency/Scarcity**: Dùng có chừng mực và trung thực
- **Friction reduction**: Form ngắn, steps rõ ràng, trust badges
- **Multiple CTAs**: Lặp lại CTA sau mỗi section thuyết phục
- **Loading speed**: Under 3 seconds — mỗi giây delay mất 7% conversion

### 9. Output format

Khi tạo trang web, output là file `.html` hoàn chỉnh có thể mở trực tiếp trong browser. File bao gồm:
- HTML structure
- Embedded CSS (trong `<style>`)
- Embedded JavaScript (trong `<script>`)
- External resources chỉ từ CDN (fonts, icons)

Ngôn ngữ content tùy thuộc vào yêu cầu cụ thể — có thể tiếng Việt, tiếng Nhật, tiếng Anh, hoặc song ngữ. Hãy xác nhận với user nếu chưa rõ.

### 10. Checklist trước khi giao

- [ ] Responsive trên mobile, tablet, desktop
- [ ] Animations mượt, không giật
- [ ] Tất cả links và buttons hoạt động
- [ ] Typography hierarchy rõ ràng
- [ ] Color contrast đạt chuẩn
- [ ] Images có alt text
- [ ] Meta tags đầy đủ
- [ ] Favicon included
- [ ] Form validation (nếu có form)
- [ ] Cross-browser compatible (modern browsers)
