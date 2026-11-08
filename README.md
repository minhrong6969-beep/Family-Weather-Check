# FAMILY WEATHER STUDIO 2.0

**Website thời tiết gia đình và phòng thí nghiệm mô phỏng bão**  
Giao diện tiếng Việt/English, thân thiện điện thoại/người lớn tuổi, không cần email, không cần Firebase.

> **QUAN TRỌNG:** Có **hai cách xuất bản**, với khả năng khác nhau. Không có giải pháp chỉ kéo file tĩnh lên Netlify mà tự có database và gửi thông báo từ điện thoại này sang điện thoại khác. Bộ mã này cung cấp **cả phiên bản tĩnh chạy ngay** và **phiên bản đồng bộ qua Netlify Functions/Blobs**. Không đánh đồng hai phiên bản.

## Hai gói file

- `FamilyWeather_Studio_NETLIFY_DROP.zip`: **dùng ngay** bằng cách kéo cả ZIP/thư mục lên Netlify Drop. Đây là **demo trên từng trình duyệt**: tạo nhóm mẫu, thêm bot, chỉnh nơi ở/mức cảnh báo, chạy giả lập, ghi lịch sử, tiếng Việt/English, đổi cỡ chữ, thử quyền thông báo trình duyệt (khi trang đang hoạt động), gọi Open-Meteo khi mạng cho phép. **Không đồng bộ giữa nhiều thiết bị**.
- `FamilyWeather_Studio_ONLINE_GITHUB.zip`: **mã nguồn đầy đủ** cho việc kết nối GitHub → Netlify. Netlify tự build và triển khai **Functions + Blobs** để tạo nhóm thật, người khác tham gia qua mã mời, bot admin và cảnh báo TEST xuất hiện giữa các thành viên, cùng chức năng kiểm tra Open-Meteo theo lịch. Không cần Firebase hay tạo database thủ công. **Không chỉ kéo thư mục `site/` lên Netlify Drop** rồi kỳ vọng nhóm được đồng bộ.

## Cách A: Publish nhanh nhất với Netlify Drop

1. Giải nén `FamilyWeather_Studio_NETLIFY_DROP.zip`.
2. Truy cập **https://app.netlify.com/drop/**.
3. Kéo **thư mục `NETLIFY_DROP`** hoặc ZIP tương ứng vào trang.
4. Sau khi có URL, mở website → chọn **Trải nghiệm demo ngay**.
5. Vào **Giả lập bão → Chế độ quản trị** để sửa mức cảnh báo của Lan (bot); bấm **Gửi cảnh báo từ bot** và mở **Thông báo**.
6. Chuyển sang English ở thanh trên, hoặc vào **Cài đặt → Chữ lớn, dễ đọc**.

**Sự thật cần lưu ý:** mỗi người mở URL trên một thiết bị khác nhau sẽ có **demo riêng**, không nhìn thấy nhau; mã mời demo không đồng bộ giữa các thiết bị. Đây là hạn chế của website tĩnh, không phải lỗi của Netlify.

## Cách B: Có nhóm thực và cảnh báo giữa nhiều người (không cần Firebase)

**Không cần chạy lệnh trên máy nếu bạn triển khai từ GitHub:**

1. Giải nén `FamilyWeather_Studio_ONLINE_GITHUB.zip`.
2. Vào **https://github.com/new**, tạo repository mới, ví dụ `family-weather-studio`.
3. Vào repo → **Add file → Upload files**, tải các **tệp và thư mục bên trong** `FamilyWeather_Studio` lên **gốc repository**. Cần có `netlify.toml`, `package.json`, `site/`, `netlify/functions/`, `lib/`, `assets/`.
4. Truy cập **https://app.netlify.com/** → **Add new project** (hoặc Import an existing project) → **Deploy with GitHub** → chọn repository vừa tạo.
5. Trong cấu hình Deploy: root/base bỏ trống; Build command và Publish directory lấy từ `netlify.toml` (lần lượt là lệnh `echo` và `site`). Bấm Deploy. Netlify tự cài các dependency khai báo trong `package.json` để đóng gói Functions.
6. Mở `https://TEN-SITE.netlify.app/api/v1/health`. Nếu triển khai Functions thành công sẽ nhận:

   ```json
   {"ok":true,"backend":"netlify","version":2}
   ```

7. Mở URL chính của website. Nhãn trên thanh công cụ phải là **Nhóm trực tuyến** (nếu vẫn báo **Demo cục bộ**, Functions chưa chạy; kiểm tra Deploy/Function logs trên Netlify).
8. Tạo nhóm với tên bất kỳ, chọn **Mời người thân**, gửi mã `FW-XXXXXXXXXX` cho người thân. Họ dùng cùng URL để **Tham gia nhóm** mà **không cần email**. Mã mời dùng một lần và có hạn 72 giờ.
9. Người tạo nhóm vào **Giả lập bão → Chế độ quản trị**, thêm bot, chọn tỉnh/thành và mức ảnh hưởng, nhấn **Gửi cảnh báo từ bot**. Máy còn lại đang mở website sẽ nhận cập nhật sau khoảng **12 giây**; nếu đóng trang sẽ xem lại trong mục **Thông báo** lúc mở lại.
10. Trên bản Deploy production, Scheduled Function `check-weather` chạy **mỗi giờ UTC**. Nó kiểm tra Open-Meteo Forecast trong phạm vi xử lý được và lưu cảnh báo dự báo để các thành viên xem khi mở lại website. Đây **không phải theo dõi bão tức thời từng phút**, cũng **không phải push khi đã đóng trình duyệt**.

**Cách xác minh đồng bộ:** dùng cửa sổ ẩn danh hoặc hai điện thoại, mỗi nơi có session độc lập. Thử gửi cảnh báo từ bot admin → thành viên còn lại xem trong Thông báo.

## Các chức năng

| Chức năng | Drop tĩnh | Netlify Git + Functions |
|---|---|---|
| Giao diện responsive, 2 ngôn ngữ, chữ lớn | ✅ | ✅ |
| Tên hiển thị, không email | ✅ | ✅ |
| Tạo nhóm | Cục bộ | ✅ giữa thiết bị |
| Mã mời dùng một lần | Chỉ trình duyệt hiện tại | ✅ server |
| GPS chủ động, vị trí cố định | ✅ | ✅ |
| Dự báo Open-Meteo khi API khả dụng | ✅ | ✅ |
| User simulator (gió, mưa, thành phố) | ✅ | ✅ |
| Admin simulator và bot tùy chỉnh | ✅ | ✅ chỉ chủ nhóm |
| Lịch sử TEST alerts | Cục bộ | ✅ chia sẻ nhóm |
| Kiểm tra dự báo theo lịch máy chủ | ❌ | ✅ hàng giờ, có giới hạn |
| Thông báo khi trang đang mở | Trong trình duyệt hiện tại | ✅ trong nhóm, polling |
| Push khi trình duyệt đóng hoàn toàn | ❌ | ❌ |

## Mô hình thông báo

- **TEST**: kịch bản thử nghiệm, KHÔNG phản ánh tình hình bão thật. Bạn có thể cho bot chịu ảnh hưởng `Bình thường`, `Theo dõi`, `Nguy cơ cao`, hoặc `Rất nghiêm trọng`.
- **FORECAST**: dự báo gió giật/mưa từ Open-Meteo cho 12 giờ tới, kiểm tra định kỳ trong bản online. Nhãn `FORECAST` không phải bản tin bão chính thức.
- Nhóm thật có cơ chế lưu cảnh báo và polling khoảng 12 giây khi trang còn hoạt động. Trình duyệt có thể trì hoãn polling khi chạy nền. Trình duyệt đóng hẳn thì không thể thông báo đẩy; khi mở lại sẽ thấy lịch sử.
- Ngưỡng **minh họa, chưa hiệu chỉnh cho an toàn**: Watch khi gió giật ≥50 km/h hoặc mưa 1 giờ ≥10 mm; High ≥75 km/h / ≥20 mm; Severe ≥95 km/h / ≥35 mm. Không được dùng các ngưỡng này làm khuyến cáo sơ tán.

## Bảo mật và quyền riêng tư

- Người tham gia không cần email hoặc tài khoản bên thứ ba; chủ nhóm nhận một **mã truy cập bí mật 256-bit trên thiết bị**, server chỉ lưu SHA-256 hash. Mất mã do xóa localStorage = có thể mất quyền truy cập (không có email khôi phục).
- Tọa độ GPS chỉ được lấy khi người dùng bấm nút và cho phép; server chỉ trả lại GPS đầy đủ cho chính người đó, không trả cho thành viên khác. Người khác thấy tên thành phố đã chọn và nguy cơ thời tiết.
- Mã mời ngẫu nhiên, 1 lần sử dụng, hết hạn sau 72 giờ. Người thường không thể tạo bot, thay đổi bot hay mời người khác khi online.
- Server xác thực token cho mọi thao tác nhóm, hạn chế số lượt cảnh báo TEST (5/30 phút/thành viên) và giới hạn 15 thành viên/nhóm.
- **Giới hạn kiến trúc:** Netlify Blobs không phải database giao dịch; khi nhiều người sửa đồng thời có thể xuất hiện xung đột cần thử lại; hiếm trường hợp mã mời bị dùng nhưng lần thêm thành viên cuối cùng thất bại. Nên chuyển sang Netlify Database/Postgres khi tăng lượng người dùng. Hãy sử dụng bản này cho nhóm nhỏ, kiểm thử và trình diễn, **không làm dịch vụ cảnh báo khẩn cấp**.
- Không có hệ thống theo dõi GPS nền liên tục, không lưu lịch sử đường di chuyển, không có công cụ theo dõi lén vị trí.

## API và project

```text
FamilyWeather_Studio/
├── site/                     # Thư mục static được Netlify publish
│   ├── index.html
│   └── assets/               # CSS, JavaScript, SVG, logic demo
├── assets/                   # Logic nguồn dùng chung với worker
├── lib/                      # Server code + weather worker core
├── netlify/functions/
│   ├── api.mjs               # Nhóm, mời, bot, gửi TEST, dashboard
│   └── check-weather.mjs     # Scheduled function: mỗi giờ
├── tests/flows.test.mjs
├── netlify.toml
└── package.json
```

`GET /api/v1/health` xác nhận backend; `POST /api/v1/groups` tạo nhóm; `POST /api/v1/join` tham gia; `GET /api/v1/dashboard?groupId=...` xem nhóm; `POST /api/v1/action` xử lý thao tác có kiểm tra quyền. Mã được tổ chức dạng ESM, không dùng React build cho phiên bản này để triển khai nhẹ nhàng nhất.

## Kiểm tra code trên máy (tùy chọn)

Nếu đã cài Node.js 22+:

```bash
npm test
```

Dùng `netlify dev` khi cần chạy bản có Functions trên máy; bước này yêu cầu cài Netlify CLI và liên kết với site có Blobs. Thử nghiệm tích hợp online thực tế trên Netlify **chưa được thực hiện trong môi trường tạo project**. Các test tự động dùng Blob store giả lập, không thay thế thử nghiệm production.

## Nguồn tham khảo

- Netlify Drop: https://app.netlify.com/drop/
- Netlify Functions: https://docs.netlify.com/build/functions/get-started/
- Netlify Blobs: https://docs.netlify.com/build/data-and-storage/netlify-blobs/
- Scheduled Functions: https://docs.netlify.com/build/functions/scheduled-functions/
- Open-Meteo Forecast: https://open-meteo.com/en/docs

**Lưu ý cuối:** Không dùng dữ liệu từ project này để ra quyết định ứng phó thiên tai. Thông báo chính thức cần tham khảo cơ quan khí tượng, cảnh báo thiên tai và cơ quan quản lý tại địa phương.

---

## PHIÊN BẢN 3.0 — Bản đồ thời tiết và giao diện mới

Đọc [DEPLOY_MAP_V3.md](./DEPLOY_MAP_V3.md) trước khi triển khai. Trang Bản đồ thời tiết đứng đầu và xem được không cần tạo nhóm. Open-Meteo cung cấp lượng mưa/gió/dự báo theo điểm; RainViewer cung cấp radar mưa quá khứ; GDACS cung cấp chấm báo cáo bão nếu API hỗ trợ trình duyệt. Bản kéo-thả Netlify vẫn chỉ có nhóm demo cục bộ.


## Bản nâng cấp v4

Xem `CAP_NHAT_V4.md` để biết bản đồ, tìm kiếm địa điểm và quy tắc hiển thị màu.
