import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

interface AreaNode {
  name: string
  code: string
  children?: string[]
}

interface AreaJson {
  offices: { [key: string]: AreaNode }
  centers: { [key: string]: AreaNode & { children: string[] } }
}

const App = () => {
  const [parentList, setParentList] = useState<AreaNode[]>([])
  const [selectedParent, setSelectedParent] = useState('')
  const [childList, setChildList] = useState<{ name: string; code: string }[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [forecast, setForecast] = useState<any>(null)
  const [error, setError] = useState('')

  // 必要な地方をすべて追加してください
  const staticChildren: { [key: string]: { name: string; code: string }[] } = {
    "北海道地方": [ // 北海道地方
      { name: "宗谷地方", code: "011000" },
      { name: "上川・留萌地方", code: "012000" },
      { name: "網走・北見・紋別地方", code: "013000" },
      { name: "十勝地方", code: "014030" },
      { name: "釧路・根室地方", code: "014100" },
      { name: "胆振・日高地方", code: "015000" },
      { name: "石狩・空知・後志地方", code: "016000" },
      { name: "渡島・檜山地方", code: "017000" },
    ],
    "東北地方": [ // 東北地方
      { name: "青森県", code: "020000" },
      { name: "岩手県", code: "030000" },
      { name: "宮城県", code: "040000" },
      { name: "秋田県", code: "050000" },
      { name: "山形県", code: "060000" },
      { name: "福島県", code: "070000" },
    ],
    "関東甲信地方": [ // 関東甲信地方
      { name: "茨城県", code: "080000" },
      { name: "栃木県", code: "090000" },
      { name: "群馬県", code: "100000" },
      { name: "埼玉県", code: "110000" },
      { name: "千葉県", code: "120000" },
      { name: "東京都", code: "130000" },
      { name: "神奈川県", code: "140000" },
      { name: "山梨県", code: "190000" },
      { name: "長野県", code: "200000" },
    ],
    "東海地方": [ // 東海地方
      { name: "岐阜県", code: "210000" },
      { name: "静岡県", code: "220000" },
      { name: "愛知県", code: "230000" },
      { name: "三重県", code: "240000" },
    ],
    "北陸地方": [ // 北陸地方
      { name: "新潟県", code: "150000" },
      { name: "富山県", code: "160000" },
      { name: "石川県", code: "170000" },
      { name: "福井県", code: "180000" },
    ],
    "近畿地方": [ // 近畿地方
      { name: "滋賀県", code: "250000" },
      { name: "京都府", code: "260000" },
      { name: "大阪府", code: "270000" },
      { name: "兵庫県", code: "280000" },
      { name: "奈良県", code: "290000" },
      { name: "和歌山県", code: "300000" },
    ],
    "中国地方": [ // 中国地方（山口県を除く）
      { name: "鳥取県", code: "310000" },
      { name: "島根県", code: "320000" },
      { name: "岡山県", code: "330000" },
      { name: "広島県", code: "340000" },
    ],
    "四国地方": [ // 四国地方
      { name: "徳島県", code: "360000" },
      { name: "香川県", code: "370000" },
      { name: "愛媛県", code: "380000" },
      { name: "高知県", code: "390000" },
    ],
    "九州北部地方": [ // 九州北部地方（山口県を含む）
      { name: "山口県", code: "350000" },
      { name: "福岡県", code: "400000" },
      { name: "佐賀県", code: "410000" },
      { name: "長崎県", code: "420000" },
      { name: "熊本県", code: "430000" },
      { name: "大分県", code: "440000" },
    ],
    "九州南部・奄美地方": [ // 九州南部・奄美地方
      { name: "宮崎県", code: "450000" },
      { name: "鹿児島県", code: "460040" },
      { name: "奄美地方", code: "460100" },
    ],
    "沖縄地方": [ // 沖縄地方
      { name: "沖縄本島地方", code: "471000" },
      { name: "大東島地方", code: "472000" },
      { name: "宮古島地方", code: "473000" },
      { name: "八重山地方", code: "474000" },
    ],
  }

  // ユーティリティ関数
  const formatDate = (iso: string) => new Date(iso).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  // area.json取得＆親リスト作成
  useEffect(() => {
    const fetchArea = async () => {
      try {
        const res = await axios.get<AreaJson>('https://www.jma.go.jp/bosai/common/const/area.json')
        const parents = Object.values(res.data.centers).map((center: any) => ({
          name: center.name,
          code: center.code,
          children: center.children
        }))
        setParentList(parents)
        // 初期値セット（地方コード）
        if (parents.length > 0) setSelectedParent(parents[0].code)
      } catch (e) {
        setError('地域データの取得に失敗しました')
      }
    }
    fetchArea()
  }, [])

  // 親選択時に子リストをセット
  useEffect(() => {
    if (!selectedParent) return
    console.log('selectedParent:', selectedParent)
    console.log('staticChildren[selectedParent]:', staticChildren[selectedParent])
    const children = staticChildren[selectedParent] ?? []
    setChildList(children)
    if (children.length > 0) {
      setSelectedChild(children[0].code)
    } else {
      setSelectedChild('')
    }
  }, [selectedParent])

  // 天気API取得
  const fetchForecast = async () => {
    try {
      setError('')
      setForecast(null)
      if (!selectedChild) return
      const url = `https://www.jma.go.jp/bosai/forecast/data/forecast/${selectedChild}.json`
      const res = await axios.get(url)
      setForecast(res.data)
    } catch (e) {
      setError('天気データの取得に失敗しました')
    }
  }

  const WEATHER_ICONS: Record<string, { icon: string; className: string }> = {
    '晴れ':   { icon: '☀️', className: 'sunny' },
    '曇り':   { icon: '☁️', className: 'cloudy' },
    '雨':     { icon: '🌧️', className: 'rainy' },
    '雪':     { icon: '❄️', className: 'snowy' },
    '雷':     { icon: '⚡', className: 'thunder' },
    '暴風':   { icon: '🌪️', className: 'storm' },
  }
  const WEATHER_ICON_PRIORITY = ['雷', '雪', '雨', '暴風', '曇り', '晴れ']

  // 天気文字列からアイコンを抽出
  const getWeatherIcon = (weather: string = '') => {
    for (const key of WEATHER_ICON_PRIORITY) {
      if (weather.includes(key)) return WEATHER_ICONS[key]
    }
    return { icon: '', className: '' }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4 weather-title">気象庁 天気予報</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <label>
          <span className="label-title">地方</span>
          <select
            className="border px-3 py-2 rounded"
            value={selectedParent}
            onChange={e => setSelectedParent(e.target.value)}
          >
            {parentList.map(parent => (
              <option key={parent.code} value={parent.code}>{parent.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label-title">地域</span>
          <select
            className="border px-3 py-2 rounded"
            value={selectedChild || (childList[0]?.code || '')}
            onChange={e => setSelectedChild(e.target.value)}
            disabled={childList.length === 0}
          >
            {childList.length === 0 ? (
              <option value="">地域がありません</option>
            ) : (
              childList.map(child => (
                <option key={child.code} value={child.code}>{child.name}</option>
              ))
            )}
          </select>
        </label>
        <button
          onClick={fetchForecast}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          取得
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {forecast && Array.isArray(forecast) && (
        <div className="bg-gray-100 p-3 mb-4 rounded text-gray-800">
          <div className="mb-2">
            <strong>{forecast[0].publishingOffice}</strong>
            <span className="ml-4 text-xs text-gray-500">{formatDate(forecast[0].reportDatetime)}</span>
          </div>
          {forecast[0].headlineText && (
            <div className="mb-2 text-sm text-blue-700">{forecast[0].headlineText}</div>
          )}

          {/* カード形式で天気・風・波を表示 */}
          <div className="weather-cards">
            {(() => {
              const ts = forecast[0].timeSeries as import('./types/jma').JMATimeSeries[];
              const areaWeather = ts.find((t) => t.areas[0]?.weathers)?.areas[0];
              const dates = ts.find((t) => t.areas[0]?.weathers)?.timeDefines || [];

              return dates.map((date, i) => {
                const weather = areaWeather?.weathers?.[i] ?? '-';
                const { icon, className } = getWeatherIcon(weather)
                const wind = areaWeather?.winds?.[i] ?? '-';
                const wave = areaWeather?.waves?.[i] ?? '-';
                return (
                  <div className="weather-card" key={date}>
                    <div className="weather-date">{formatDate(date)}</div>
                    <div className="weather-main">
                      <span className={`weather-icon ${className}`}>{icon}</span>
                      <span>{weather}</span>
                    </div>
                    <div className="weather-detail wind">
                      <span className="weather-detail-icon">💨</span>
                      <strong>風：</strong>
                      <span className="weather-detail-text">{wind}</span>
                    </div>
                    <div className="weather-detail wave">
                      <span className="weather-detail-icon">🌊</span>
                      <strong>波：</strong>
                      <span className="weather-detail-text">{wave}</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default App

