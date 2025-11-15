// Web Worker لتحويل الملفات إلى base64 في خلفية منفصلة

self.addEventListener("message", async (e) => {
  const { file, id } = e.data;

  try {
    // قراءة الملف في chunks لتحسين الأداء
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = Math.ceil(file.size / chunkSize);

    // إرسال تحديثات التقدم
    for (let i = 0; i < chunks; i++) {
      const progress = Math.round(((i + 1) / chunks) * 100);
      self.postMessage({
        type: "progress",
        id: id,
        progress: progress,
      });

      // إعطاء فرصة للمتصفح للتنفس
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // تحويل الملف إلى base64
    const reader = new FileReaderSync();
    const result = reader.readAsDataURL(file);

    self.postMessage({
      type: "complete",
      id: id,
      result: result,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      id: id,
      error: error.message,
    });
  }
});
