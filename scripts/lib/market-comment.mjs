const COMMENT = {
  '풀매수':            '추세 강하고 변동성 작음. 지금은 적극 들고 가도 됨.',
  '분할매수':          '방향은 위지만 흔들림 있음. 한 번에 다 넣지 말고 나눠서.',
  '관망/존버':         '방향 애매. 무리해서 사지도 팔지도 말고 가만히.',
  '비중축소+이익실현': '추세 꺾이고 공포 커짐. 일부 현금화하고 이익 챙겨둘 때.',
};

export function marketComment(label) {
  return COMMENT[label] ?? '데이터 부족.';
}

const WEIGHT_VALUE = {
  '풀매수': 95,
  '분할매수': 70,
  '관망/존버': 50,
  '비중축소+이익실현': 20,
};

const weightRange = (avg) => {
  if (avg >= 85) return '90~100%';
  if (avg >= 65) return '70~85%';
  if (avg >= 40) return '40~60%';
  return '10~30%';
};

const overallText = (avg) => {
  if (avg >= 85) return '글로벌 분위기 강세. 적극 비중 유지.';
  if (avg >= 65) return '글로벌 분위기 양호. 분할 매수 위주.';
  if (avg >= 40) return '시장 혼조. 무리한 진입 자제.';
  return '위험 자산 회피 국면. 일부 현금화하고 이익 챙길 것.';
};

export function overallComment(markets) {
  if (markets.length === 0) return { weight: '40~60%', comment: '데이터 부족.' };
  const values = markets.map((m) => WEIGHT_VALUE[m.label] ?? 50);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { weight: weightRange(avg), comment: overallText(avg) };
}
