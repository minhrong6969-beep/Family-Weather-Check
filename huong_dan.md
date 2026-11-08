# Family Weather 3.0 — Hướng dẫn triển khai

## Có gì mới?

- **Bản đồ thời tiết là trang đầu tiên**, xem được ngay cả khi chưa tạo nhóm.
- Bản đồ tương tác OpenStreetMap + Leaflet, chọn vị trí bằng cách nhấn vào bản đồ, tìm địa điểm, chọn thành phố hoặc cho phép GPS.
- Open-Meteo: thời tiết hiện tại, lượng mưa, gió giật và áp suất; dự báo 24 giờ và tổng mưa 7 ngày tại điểm đã chọn.
- Lớp radar RainViewer: khung radar quan trắc **quá khứ**, không phải mô hình dự báo đường đi của cơn bão.
- Lớp bản tin bão GDACS: đánh dấu thông tin các cơn bão nhiệt đới hiện hành nếu API cấp được dữ liệu cho trình duyệt. Khi không truy cập được, website ghi rõ không khả dụng, không bịa vị trí.
- Settings: bảng màu **Trắng–Navy** hoặc **Trắng–Đen** và cỡ chữ lớn. Lưu trong trình duyệt.
- Giữ lại User/Admin simulator, bot thử nghiệm, tiếng Việt/English, nhóm thử nghiệm.

## Cách 1: Kéo thả lên Netlify (không build)

1. Giải nén `FamilyWeather_v3_NETLIFY_DROP.zip`.
2. Truy cập https://app.netlify.com/drop/.
3. Kéo thả **thư mục đã giải nén** (chứa `index.html` và `assets/`), không tải riêng `index.html`.
4. Mở địa chỉ Netlify. Trình duyệt cần Internet để tải Leaflet, bản đồ nền và các nguồn dữ liệu thời tiết.
5. Vào `Bản đồ thời tiết`, chọn điểm cần xem. Đổi bảng màu trong `Cài đặt`.

**Giới hạn bản kéo thả:** Đăng ký/tạo nhóm giả lập lưu cục bộ trên từng trình duyệt. Dữ liệu không tự đồng bộ giữa các thiết bị; cảnh báo TEST không được gửi đến thiết bị khác. Không có push notification khi đã đóng trình duyệt.

## Cách 2: Netlify + GitHub (đồng bộ nhóm)

1. Giải nén `FamilyWeather_v3_ONLINE_GITHUB.zip`.
2. Upload **các file bên trong thư mục `FamilyWeather_Studio`** vào root của một GitHub repository.
3. Netlify → Add new project → Import from Git → chọn repository.
4. Netlify tự đọc `netlify.toml`: Publish directory `site`, Functions `netlify/functions`. Không cần chạy một lệnh build web riêng trên máy.
5. Cấu hình trạng thái, dữ liệu của Netlify backend theo README gốc. Backend online dùng Netlify Blobs và Scheduled Functions, phụ thuộc vào khả năng/gói Netlify.
6. Mở trang để xác minh dòng trạng thái `Nhóm trực tuyến` trước khi tạo nhóm dùng chung.

## Nguồn dữ liệu và giới hạn quan trọng

- **Open-Meteo Forecast:** số liệu dự báo theo mô hình tại một điểm; `precipitation` theo giờ (mm), `precipitation_sum` theo ngày (mm), gió giật (km/h), áp suất (hPa). Không phải trạm đo trực tiếp hay bản tin bão chính thức. https://open-meteo.com/en/docs
- **RainViewer:** cung cấp radar quá khứ với tile zoom tối đa gốc 7, không còn radar nowcast miễn phí từ 2026. API có thể thiếu độ phủ, giới hạn truy cập; không lấy được thì thông báo lỗi và vẫn dùng Open-Meteo. https://www.rainviewer.com/api.html
- **GDACS:** lớp chấm các sự kiện TC hiện hành khi có dữ liệu; có thể bị giới hạn CORS trên trang tĩnh. API không đảm bảo mọi cơn bão hay đường dự báo được thể hiện. https://www.gdacs.org/gdacsapi/swagger/index.html
- **Rủi ro:** các mốc gió giật >= 50/75 km/h, mưa >= 10/20 mm mỗi giờ chỉ là ngưỡng TEST, không được gọi là cấp bão hay hướng dẫn sơ tán.
- **An toàn:** luôn tham khảo cơ quan dự báo khí tượng có thẩm quyền. Không phụ thuộc ứng dụng này cho quyết định ứng phó khẩn cấp.
- **Chi phí/giới hạn:** chỉ phù hợp bản demo, giáo dục, lưu lượng nhỏ. Kiểm tra điều khoản nguồn dữ liệu và Netlify nếu chuyển sang hoạt động thương mại.

## Kiểm tra nhanh

- Trang mở ra là Bản đồ thời tiết, không yêu cầu đăng nhập.
- Nhấn vào bản đồ: bảng bên phải đổi tọa độ và thử lấy Open-Meteo.
- Tìm "Da Nang" và chọn gợi ý; hoặc dùng nút Đà Nẵng.
- Bật/tắt radar, bật/tắt bản tin bão.
- Mục `Cài đặt`: chọn Trắng–Đen/Trắng–Navy; tải lại trang để xem lựa chọn được lưu.
- Tạo demo trong `Gia đình`, kiểm tra các nút bot/giả lập cũ vẫn dùng được.

## Lưu ý triển khai

Trang tĩnh không chứa backend. Tính năng nhóm thật giữa nhiều thiết bị chỉ có trong gói GitHub/Functions. Độ khả dụng của radar/GDACS có thể thay đổi và cần kiểm thử khi deploy thật trên Netlify. Tải dữ liệu thời tiết cần kết nối mạng; không có dữ liệu trực tiếp khi offline.
