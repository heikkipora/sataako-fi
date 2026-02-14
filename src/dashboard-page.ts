export function statsPageHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard - Sataako.fi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #1a1a2e; color: #e0e0e0; padding: 24px; }
    h1 { color: #4a90d9; margin-bottom: 24px; font-size: 24px; }
    .chart-container { max-width: 600px; background: #16213e; border-radius: 8px; padding: 16px; }
    .chart-container h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #4a90d9; margin-bottom: 4px; }
    .chart-container .value { font-size: 36px; font-weight: 700; color: #fff; margin-bottom: 12px; }
    canvas { width: 100%; height: 150px; display: block; }
  </style>
</head>
<body>
  <h1>Sataako.fi Dashboard</h1>
  <div class="chart-container">
    <h2>Active Users</h2>
    <div class="value" id="users-value">0</div>
    <canvas id="users-chart"></canvas>
  </div>
  <script>
    const HISTORY = 120
    const usersHistory = new Array(HISTORY).fill(0)

    const usersCanvas = document.getElementById('users-chart')
    const usersValue = document.getElementById('users-value')

    function drawChart(canvas, data, color) {
      const ctx = canvas.getContext('2d')
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      const w = rect.width
      const h = rect.height

      ctx.clearRect(0, 0, w, h)

      const max = Math.max(1, ...data)
      const step = w / (data.length - 1)

      ctx.beginPath()
      ctx.moveTo(0, h)
      for (let i = 0; i < data.length; i++) {
        ctx.lineTo(i * step, h - (data[i] / max) * (h - 4))
      }
      ctx.lineTo(w, h)
      ctx.closePath()
      ctx.fillStyle = color + '20'
      ctx.fill()

      ctx.beginPath()
      for (let i = 0; i < data.length; i++) {
        const x = i * step
        const y = h - (data[i] / max) * (h - 4)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#888'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(String(max), w - 4, 14)
    }

    const source = new EventSource('/dashboard/live')
    source.onmessage = (event) => {
      const { activeUsers } = JSON.parse(event.data)

      usersHistory.push(activeUsers)
      usersHistory.shift()

      usersValue.textContent = activeUsers
      drawChart(usersCanvas, usersHistory, '#4a90d9')
    }
  </script>
</body>
</html>`
}
