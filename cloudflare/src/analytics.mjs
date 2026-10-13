export function jstDay(now=Date.now()){return new Date(now+9*3600000).toISOString().slice(0,10);}
export function shouldCount(request,path){return request.method==='GET'&&(path==='/'||path==='/index.html')&&!/prefetch|prerender/i.test(request.headers.get('purpose')||request.headers.get('sec-purpose')||'');}
export async function recordView(db,allowed,now=Date.now()){
  await db.prepare('INSERT INTO access_daily(day,game_views,closed_views) VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET game_views=game_views+excluded.game_views,closed_views=closed_views+excluded.closed_views').bind(jstDay(now),allowed?1:0,allowed?0:1).run();
}
export async function analyticsData(db,now=Date.now()){
  const session=db.withSession('first-primary');
  const [meta,total,recent]=await Promise.all([
    session.prepare('SELECT started_at FROM access_metadata WHERE id=1').first(),
    session.prepare('SELECT COALESCE(SUM(game_views),0) AS gameViews,COALESCE(SUM(closed_views),0) AS closedViews FROM access_daily').first(),
    session.prepare('SELECT day,game_views AS gameViews,closed_views AS closedViews FROM access_daily WHERE day>=? ORDER BY day DESC').bind(jstDay(now-29*86400000)).all()
  ]);
  return {startedAt:meta?.started_at??null,today:jstDay(now),total,days:recent.results};
}
