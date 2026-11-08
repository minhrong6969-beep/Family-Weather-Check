# Family Weather v4 — Cập nhật bản đồ và đánh giá 3 mức

## Điểm mới
- Bản đồ là trang đầu tiên. Chọn điểm trực tiếp hoặc tìm tên thành phố/địa danh ở ô **Tìm địa điểm trên bản đồ**. Khi gõ từ 2 ký tự, website gợi ý kết quả, và có thể nhấn **Tìm** để tìm thủ công.
- Bảng lớn cạnh bản đồ hiện **AN TOÀN (xanh)**, **NGUY CƠ (vàng)**, **NGUY HIỂM (đỏ)**. Trạng thái xám là **CHƯA CÓ DỮ LIỆU**.
- Tự cập nhật mức nguy cơ và màu ghim vị trí khi chọn nơi khác. Có thông tin lượng mưa, gió và dự báo 24 giờ / 7 ngày.
- Có tiếng Việt / English, giao diện trắng–đen hoặc trắng–navy ở Settings.
- Giữ nguyên Family, bot, giả lập TEST và cấu trúc deploy như v3.

## Cách đánh giá (thử nghiệm, không phải cấp bão chính thức)
Dựa trên **gió giật lớn nhất 24 giờ tới** (km/h) hoặc **mưa trong một giờ bất kỳ** của 24 giờ tới (mm/giờ), từ dữ liệu dự báo Open-Meteo:

| Mức hiển thị | Điều kiện thử nghiệm |
| --- | --- |
| AN TOÀN (xanh) | Gió giật < 50 km/h **và** mưa < 10 mm/giờ, có ít nhất 6 giá trị hợp lệ của mỗi biến |
| NGUY CƠ (vàng) | Gió giật >= 50 km/h hoặc mưa >= 10 mm/giờ, chưa vượt ngưỡng đỏ |
| NGUY HIỂM (đỏ) | Gió giật >= 75 km/h hoặc mưa >= 20 mm/giờ |
| CHƯA CÓ DỮ LIỆU (xám) | Không đủ dữ liệu để kết luận mức xanh/vàng/đỏ |

**RẤT QUAN TRỌNG:** Ngưỡng trên là quy tắc *demo để thử UI*, không được kiểm định về khí tượng. Xanh **không đảm bảo an toàn** hay chứng minh không có bão. Mưa và gió không đủ để xác nhận vị trí nằm trong vùng bão; hãy đối chiếu với cảnh báo chính thức của cơ quan khí tượng. Nếu API lỗi, website hiển thị xám thay vì xanh. Chỉ sử dụng để theo dõi tham khảo, không dùng làm hệ thống cảnh báo thiên tai khẩn cấp.

## Cách dùng
1. Vào **Bản đồ thời tiết** (trang đầu), nhập tên địa điểm vào ô tìm kiếm.
2. Chọn gợi ý hoặc nhấn Tìm rồi chọn một kết quả. Có thể nhấn điểm trên bản đồ hoặc nút Vị trí của tôi.
3. Đọc bảng màu lớn bên cạnh bản đồ. Xem dự báo chi tiết phía dưới.
4. Có thể bật/tắt lớp radar RainViewer và điểm bão GDACS. Bão GDACS không được dùng để giả lập màu đánh giá của vị trí.

## Triển khai
### Bản Netlify Drop
Giải nén ZIP rồi kéo **thư mục chứa `index.html` và `assets/`** vào https://app.netlify.com/drop/.
Bản này công khai xem dự báo, thay đổi cài đặt và giả lập trên từng thiết bị; **không đồng bộ nhóm giữa các điện thoại**.

### Bản Online GitHub
Giải nén ZIP và đẩy **nội dung bên trong thư mục `FamilyWeather_Studio/`** lên repository (để `netlify.toml` ở gốc).
Kết nối repository với Netlify để Netlify triển khai Netlify Functions + Blobs theo cấu hình có sẵn. Đây là bản đồng bộ nhóm.
Nếu dùng Netlify Drop chỉ tải HTML tĩnh thì sẽ không có backend nhóm.

### Kiểm tra
Chạy tại thư mục gốc bản Online: `node --test tests/*.test.mjs` (Node.js 22+). Kiểm thử tự động bao gồm luồng nhóm và ba mức đánh giá, cũng như trường hợp thiếu dữ liệu.

## Nguồn dữ liệu
- Open-Meteo: https://open-meteo.com/en/docs
- Geocoding search: https://open-meteo.com/en/docs/geocoding-api
- Radar: https://www.rainviewer.com/api.html
- GDACS: https://www.gdacs.org/
