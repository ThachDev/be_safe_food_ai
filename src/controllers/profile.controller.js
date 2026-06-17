exports.getOptions = async (req, res) => {
  try {
    const options = {
      diets: [
        'Bình thường',
        'Ăn chay',
        'Chay trường',
        'Thuần chay',
        'Giảm tinh bột',
        'Kiêng hoàn toàn tinh bột',
        'Khác'
      ],
      allergies: [
        'Trứng',
        'Sữa bò',
        'Lúa mì',
        'Hải sản',
        'Thịt bò',
        'Đậu nành',
        'Mè (Vừng)',
        'Đậu phộng (Lạc)',
        'Bột ngọt (Mì chính)',
        'Các loại hạt',
        'Khác'
      ],
      diseases: [
        'Tiểu đường',
        'Cao huyết áp',
        'Gút',
        'Bệnh thận',
        'Mỡ máu cao',
        'Bệnh tim mạch',
        'Đau dạ dày / Trào ngược',
        'Khác'
      ],
      healthGoals: [
        'Giữ dáng',
        'Giảm cân, giảm mỡ',
        'Tăng cân, tăng cơ',
        'Ăn uống lành mạnh',
        'Bảo vệ tim mạch',
        'Tốt cho tiêu hóa',
        'Cải thiện tiêu hóa',
        'Tăng sức đề kháng',
        'Kiểm soát lượng đường',
        'Ổn định đường huyết',
        'Khác'
      ]
    };

    return res.status(200).json({
      success: true,
      message: 'Profile options retrieved successfully',
      data: options
    });
  } catch (error) {
    console.error('[Profile Controller] Error getting options:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile options',
      error: error.message
    });
  }
};
