# Góc luyện tập MLN

Web trắc nghiệm chạy bằng HTML, CSS và JavaScript, không cần cài thư viện để sử dụng.

Học trực tiếp: <https://dhao1601.github.io/mln-luyen-tap/> · [Đề 2 MLN111](https://dhao1601.github.io/mln-luyen-tap/?de=2).

- Đề 1 · MLN122: 538 câu, có mẹo ghi nhớ và ví dụ.
- Đề 2 · MLN111: 598 câu.
- Lưu tiến độ và câu sai riêng cho từng đề trong trình duyệt.
- Đáp án đúng có màu xanh và âm thanh; có nút tắt âm.

## Chạy trên máy

Trong thư mục dự án:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory dist
```

Mở <http://127.0.0.1:8766/> hoặc <http://127.0.0.1:8766/?de=2>.

Tiến độ được lưu bằng localStorage, không được đồng bộ qua GitHub hoặc giữa các trình duyệt.

## Kiểm tra và chỉnh nội dung

```sh
node check.cjs
node build-notes.cjs
```

`dist/` chứa web, `notes/` chứa nội dung và dữ liệu đối chiếu. `import-mln111.py` nhập lại từ PDF MLN111 và cần Python với pdfplumber. PDF gốc không nằm trong repo.

Khóa đáp án dựa trên tài liệu nguồn; câu có điểm chưa rõ được đánh dấu và bỏ qua mặc định. MLN111 chưa có bộ mẹo tự soạn. Xem `LOCAL.txt` và `audio-source.txt` để biết thêm.

Nhánh `main` lưu mã nguồn. GitHub Pages phục vụ nội dung nhánh `gh-pages`, được tách từ `dist/`.

Sau khi chỉnh web, kiểm tra rồi cập nhật bản học trực tuyến:

```sh
node check.cjs
git add .
git commit -m "Update quiz"
git push origin main
git subtree push --prefix dist origin gh-pages
```
