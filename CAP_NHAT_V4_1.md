# FAMILY WEATHER v4.1 – Thanh thành viên nổi

## Điểm mới
- Thanh **Nhóm (số thành viên)** cố định ở góc phải bên dưới, thu gọn mặc định.
- Mở ra để xem thành viên, bot, thành phố theo dõi và trạng thái **An toàn (xanh) / Nguy cơ (vàng) / Nguy hiểm (đỏ) / Chưa có dữ liệu (xám)**.
- Tình trạng từ bot hoặc giả lập người dùng có nhãn **TEST**; dự báo Open-Meteo có nhãn **DỰ BÁO** và thời gian cập nhật.
- Thành viên nguy hiểm xuất hiện trước; nhấn vào thành viên để mở bản đồ tại khu vực đã chọn.
- Hoạt động trên các trang, responsive cho điện thoại, nhớ trạng thái thu gọn sau khi tải lại.
- Song ngữ Việt – Anh, tương thích theme Trắng–Đen và Trắng–Navy.

## Chú ý
- **Netlify Drop**: giả lập và nhóm chỉ nằm trên trình duyệt hiện tại, không đồng bộ giữa các điện thoại.
- **Bản Online GitHub + Netlify Functions**: dữ liệu nhóm và bot có thể đồng bộ qua backend. Thanh thành viên cũng cập nhật theo chu kỳ tải lại dữ liệu nhóm (~12 giây).
- Màu của bot là **TEST**, không phải bão thật. Màu của người từ dự báo thời tiết không thể khẳng định một cơn bão đang diễn ra.
- Khi không có dự báo đủ mới, người thật hiển thị **Chưa có dữ liệu**. Đây không có nghĩa là an toàn.
- Vị trí bản đồ của thành viên khác sử dụng thành phố theo dõi; không làm lộ tọa độ GPS riêng tư của họ.

## Cách triển khai
- Netlify Drop: giải nén ZIP, kéo **thư mục chứa index.html và assets/** lên Netlify Drop. Không cần npm.
- Online: giải nén ZIP, tải các tệp trong thư mục FamilyWeather_Studio lên GitHub repository, kết nối repository với Netlify. Cấu hình trong netlify.toml được giữ nguyên.
- Đây là bản nâng cấp giao diện và logic. Chưa tích hợp push notification khi trình duyệt đóng hoàn toàn.
