import React, { useState, useEffect } from 'react';
import "./App.css"

const App = () => {
  const getSaved = (key, def) => {
    const saved = localStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : def;
  };

  const [step, setStep] = useState(getSaved('step', 'setup'));
  const [maxOvers, setMaxOvers] = useState(getSaved('maxOvers', 1));
  const [playerInput, setPlayerInput] = useState(getSaved('playerInput', ""));
  const [players, setPlayers] = useState(getSaved('players', []));
  const [innings, setInnings] = useState(getSaved('innings', 1));
  const [target, setTarget] = useState(getSaved('target', null));
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const [stats, setStats] = useState(getSaved('stats', {
    inn1Batting: [], inn1Bowling: {},
    inn2Batting: [], inn2Bowling: {}
  }));

  const [match, setMatch] = useState(getSaved('match', {
    totalRuns: 0, wickets: 0, ballsInOver: 0, completedOvers: 0,
    strikerId: null, nonStrikerId: null, bowler: "", lastBowler: ""
  }));

  useEffect(() => {
    localStorage.setItem('step', JSON.stringify(step));
    localStorage.setItem('maxOvers', JSON.stringify(maxOvers));
    localStorage.setItem('playerInput', JSON.stringify(playerInput));
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('match', JSON.stringify(match));
    localStorage.setItem('innings', JSON.stringify(innings));
    localStorage.setItem('target', JSON.stringify(target));
    localStorage.setItem('stats', JSON.stringify(stats));
  }, [step, match, innings, target, players, stats]);

  const resetAll = () => {
    if (window.confirm("Naya match start karein?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const initMatch = () => {
    const names = playerInput.split(/[,\n]/).map(n => n.trim()).filter(n => n !== "");
    if (names.length < 4) return alert("Kam se kam 4 players chahiye!");
    const playerObjects = names.map((n, i) => ({ 
      id: i, name: n, runs: 0, balls: 0, sixes: 0, fours: 0, isOut: false 
    }));
    setPlayers(playerObjects);
    setStep('match');
    setShowModal('initial-selection');
  };

  const handleEntry = (runs) => {
    if (winner) return;
    let newMatch = { ...match };
    let newPlayers = [...players];
    let newStats = { ...stats };

    const sIdx = newPlayers.findIndex(p => p.id === newMatch.strikerId);
    if (sIdx !== -1) {
      newPlayers[sIdx].runs += runs;
      newPlayers[sIdx].balls += 1;
      if (runs === 4) newPlayers[sIdx].fours += 1;
      if (runs === 6) newPlayers[sIdx].sixes += 1;
    }
    
    newMatch.totalRuns += runs;
    newMatch.ballsInOver += 1;

    const currentInns = innings === 1 ? 'inn1Bowling' : 'inn2Bowling';
    const bName = newMatch.bowler;
    if (!newStats[currentInns][bName]) {
      newStats[currentInns][bName] = { name: bName, balls: 0, runs: 0, wickets: 0 };
    }
    newStats[currentInns][bName].runs += runs;
    newStats[currentInns][bName].balls += 1;

    if (runs % 2 !== 0) {
      const temp = newMatch.strikerId;
      newMatch.strikerId = newMatch.nonStrikerId;
      newMatch.nonStrikerId = temp;
    }

    setPlayers(newPlayers);
    setStats(newStats);

    if (newMatch.ballsInOver === 6) {
      newMatch.completedOvers += 1;
      newMatch.ballsInOver = 0;
      const temp = newMatch.strikerId;
      newMatch.strikerId = newMatch.nonStrikerId;
      newMatch.nonStrikerId = temp;

      if (newMatch.completedOvers >= maxOvers) {
        setMatch(newMatch);
        checkMatchStatus(newMatch, newPlayers, newStats);
      } else {
        newMatch.lastBowler = newMatch.bowler; // Save current bowler as lastBowler
        setMatch(newMatch);
        setShowModal('over-end');
      }
      return;
    }
    setMatch(newMatch);
    if (innings === 2) checkMatchStatus(newMatch, newPlayers, newStats);
  };

  const handleWicket = () => {
    let newMatch = { ...match };
    let newPlayers = [...players];
    let newStats = { ...stats };
    const sIdx = newPlayers.findIndex(p => p.id === newMatch.strikerId);
    if (sIdx !== -1) newPlayers[sIdx].isOut = true;
    newMatch.wickets += 1;
    newMatch.ballsInOver += 1;

    const currentInns = innings === 1 ? 'inn1Bowling' : 'inn2Bowling';
    if (newStats[currentInns][newMatch.bowler]) {
      newStats[currentInns][newMatch.bowler].wickets += 1;
      newStats[currentInns][newMatch.bowler].balls += 1;
    }

    setPlayers(newPlayers);
    setStats(newStats);
    if (newMatch.wickets >= players.length - 1) {
      setMatch(newMatch);
      checkMatchStatus(newMatch, newPlayers, newStats);
    } else {
      setMatch(newMatch);
      setShowModal('new-batsman');
    }
  };

  const checkMatchStatus = (currentMatch, currentPlayers, currentStats) => {
    const key = innings === 1 ? 'inn1Batting' : 'inn2Batting';
    const played = currentPlayers.filter(p => p.balls > 0 || p.isOut);
    
    if (innings === 1 && currentMatch.completedOvers >= maxOvers) {
      setStats(prev => ({ ...prev, [key]: played }));
      setTarget(currentMatch.totalRuns + 1);
      setShowModal('innings-break');
    } else if (innings === 2) {
      if (currentMatch.totalRuns >= target) {
        setStats(prev => ({ ...prev, [key]: played }));
        setWinner("Second Innings Won! 🎉");
      } else if (currentMatch.completedOvers >= maxOvers || currentMatch.wickets >= players.length - 1) {
        setStats(prev => ({ ...prev, [key]: played }));
        setWinner(currentMatch.totalRuns < target - 1 ? "First Innings Won! 🏆" : "Match Tied! 🤝");
      }
    }
  };

  const adjustScore = (type, value) => {
    let newMatch = { ...match };
    let newPlayers = [...players];
    const sIdx = newPlayers.findIndex(p => p.id === newMatch.strikerId);
    const nsIdx = newPlayers.findIndex(p => p.id === newMatch.nonStrikerId);

    if (type === 'totalRuns') newMatch.totalRuns = Math.max(0, newMatch.totalRuns + value);
    if (type === 'strikerRuns' && sIdx !== -1) newPlayers[sIdx].runs = Math.max(0, newPlayers[sIdx].runs + value);
    if (type === 'nonStrikerRuns' && nsIdx !== -1) newPlayers[nsIdx].runs = Math.max(0, newPlayers[nsIdx].runs + value);
    
    if (type === 'ballPlus') {
      newMatch.ballsInOver += 1;
      if (newMatch.ballsInOver > 5) { newMatch.ballsInOver = 0; newMatch.completedOvers += 1; }
    }
    if (type === 'ballMinus') {
      newMatch.ballsInOver -= 1;
      if (newMatch.ballsInOver < 0) { newMatch.ballsInOver = 5; newMatch.completedOvers = Math.max(0, newMatch.completedOvers - 1); }
    }

    setMatch(newMatch);
    setPlayers(newPlayers);
  };

  const getPlayer = (id) => players.find(p => p.id === id) || { name: "---", runs: 0, balls: 0 };
  const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

  const ReportTable = ({ title, batData, bowlData }) => (
    <div className="mb-8 w-full">
      <h3 className="text-blue-400 font-black mb-3 border-l-4 border-blue-600 pl-2">{title}</h3>
      <div className="overflow-x-auto mb-4 bg-slate-900 rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800 text-slate-400">
            <tr><th className="p-3">Batsman</th><th className="p-3">R</th><th className="p-3">B</th><th className="p-3">4s</th><th className="p-3">6s</th></tr>
          </thead>
          <tbody>
            {batData.map((p, i) => (
              <tr key={i} className="border-t border-slate-800">
                <td className="p-3 font-bold">{p.name} {p.isOut ? '' : '*'}</td>
                <td className="p-3 text-blue-400">{p.runs}</td><td className="p-3">{p.balls}</td>
                <td className="p-3 text-orange-400">{p.fours}</td><td className="p-3 text-green-400">{p.sixes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800 text-slate-400">
            <tr><th className="p-3">Bowler</th><th className="p-3">O</th><th className="p-3">R</th><th className="p-3">W</th></tr>
          </thead>
          <tbody>
            {Object.values(bowlData).map((b, i) => (
              <tr key={i} className="border-t border-slate-800">
                <td className="p-3 font-bold">{b.name}</td><td className="p-3">{formatOvers(b.balls)}</td>
                <td className="p-3 text-red-400">{b.runs}</td><td className="p-3 text-orange-500 font-black">{b.wickets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans flex flex-col items-center">
      <button onClick={resetAll} className="fixed top-4 right-4 z-40 bg-red-600/20 hover:bg-red-600 border border-red-600 text-red-500 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition">RESET</button>

      {step === 'setup' && (
        <div className="w-full max-w-md bg-slate-900 p-8 rounded-3xl border border-slate-800 mt-10 shadow-2xl">
          <h2 className="text-3xl font-black text-blue-500 mb-6 uppercase tracking-tighter text-center">Cricket Scorer</h2>
          <div className="space-y-5">
            <div><label className="text-xs font-bold text-slate-500">MAX OVERS</label>
            <input type="number" className="w-full p-4 bg-slate-800 rounded-xl mt-1 border border-slate-700 outline-none" value={maxOvers} onChange={(e)=>setMaxOvers(Number(e.target.value))} /></div>
            <div><label className="text-xs font-bold text-slate-500">PLAYERS (COMMA/ENTER)</label>
            <textarea className="w-full p-4 bg-slate-800 rounded-xl mt-1 h-48 border border-slate-700 outline-none" placeholder="Virat, Dhoni..." value={playerInput} onChange={(e)=>setPlayerInput(e.target.value)} /></div>
            <button onClick={initMatch} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase transition-all">Start Match</button>
          </div>
        </div>
      )}

      {step === 'match' && !showReport && (
        <div className="w-full max-w-lg mt-8">
          <div className="flex justify-between items-end mb-6 px-2">
            <div><p className="text-xs font-black text-blue-500 uppercase">Innings {innings}</p>
            <h1 className="text-7xl font-black">{match.totalRuns}<span className="text-3xl text-slate-600">/{match.wickets}</span></h1></div>
            {target && <div className="bg-amber-600/10 border border-amber-500 p-3 rounded-2xl text-right">
              <p className="text-[10px] font-bold text-amber-400 uppercase">Target</p>
              <p className="text-2xl font-black text-white">{target}</p>
            </div>}
          </div>

          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 mb-4 shadow-xl">
             <div className="flex justify-between items-center mb-4">
                <p className="text-lg font-bold text-slate-400 font-mono">Overs: <span className="text-white text-2xl">{match.completedOvers}.{match.ballsInOver}</span> / {maxOvers}</p>
                <button onClick={()=>setShowModal('adjust')} className="bg-slate-800 p-2 rounded-lg text-[10px] font-black border border-slate-700 text-blue-400">⚙️ ADJUST</button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-4 rounded-2xl border border-blue-500/20">
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">* STRIKER</p>
                   <p className="font-bold truncate text-lg">{getPlayer(match.strikerId).name}</p>
                   <p className="text-2xl font-black text-blue-400">{getPlayer(match.strikerId).runs} <span className="text-xs text-slate-500">({getPlayer(match.strikerId).balls})</span></p>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NON-STRIKER</p>
                   <p className="font-bold truncate text-lg">{getPlayer(match.nonStrikerId).name}</p>
                   <p className="text-2xl font-black text-slate-200">{getPlayer(match.nonStrikerId).runs} <span className="text-xs text-slate-500">({getPlayer(match.nonStrikerId).balls})</span></p>
                </div>
             </div>
             <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase">Bowler:</span>
                <span className="text-sm font-black text-orange-500 uppercase">{match.bowler || 'SELECT'}</span>
             </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(n => <button key={n} onClick={()=>handleEntry(n)} className="h-16 bg-slate-800 rounded-2xl font-black text-xl hover:bg-slate-700">{n}</button>)}
            <button onClick={()=>handleEntry(4)} className="h-16 bg-orange-600 rounded-2xl font-black text-xl">4</button>
            <button onClick={()=>handleEntry(6)} className="h-16 bg-green-600 rounded-2xl font-black text-xl">6</button>
            <button onClick={()=>adjustScore('totalRuns', 1)} className="h-16 bg-slate-900 rounded-2xl font-bold text-blue-400 border border-blue-900/50 text-xs">WD</button>
            <button onClick={()=>adjustScore('totalRuns', 1)} className="h-16 bg-slate-900 rounded-2xl font-bold text-blue-400 border border-blue-900/50 text-xs">NB</button>
            <button onClick={handleWicket} className="col-span-2 h-16 bg-red-600 rounded-2xl font-black text-xl uppercase">Wicket</button>
            <button onClick={()=>{setMatch(p=>({...p, strikerId: p.nonStrikerId, nonStrikerId: p.strikerId}))} } className="col-span-2 h-16 bg-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest">Swap Strike ⇄</button>
          </div>
        </div>
      )}

      {showReport && (
        <div className="w-full max-w-lg mt-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mt-12 mb-6">
            <h2 className="text-2xl font-black italic tracking-tighter">MATCH REPORT</h2>
            <button onClick={()=>setShowReport(false)} className="text-xs bg-slate-800 px-4 py-2 rounded-full font-bold">CLOSE ×</button>
          </div>
          <div className="bg-blue-600 p-4 rounded-2xl mb-6 text-center shadow-xl">
             <p className="text-[10px] font-black uppercase text-blue-200">Winner</p>
             <h2 className="text-2xl font-black">{winner}</h2>
          </div>
          <ReportTable title="1ST INNINGS" batData={stats.inn1Batting} bowlData={stats.inn1Bowling} />
          {target && <div className="relative h-12 flex items-center justify-center mb-8">
               <div className="absolute w-full h-px bg-slate-800"></div>
               <span className="relative z-10 bg-slate-950 px-4 text-slate-500 font-bold text-xs">2ND INNINGS START</span>
          </div>}
          <ReportTable title="2ND INNINGS" batData={stats.inn2Batting} bowlData={stats.inn2Bowling} />
          <button onClick={resetAll} className="w-full bg-white text-black py-5 rounded-3xl font-black text-lg mb-10 shadow-2xl">START NEW MATCH</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-black text-blue-500 mb-6 uppercase text-center border-b border-slate-800 pb-3">{showModal.replace('-', ' ')}</h2>
            
            {showModal === 'initial-selection' && (
              <div className="space-y-4">
                <select className="w-full p-4 bg-slate-800 rounded-xl" value={match.strikerId === null ? "" : match.strikerId} onChange={(e)=>setMatch(p=>({...p, strikerId: Number(e.target.value)}))}>
                  <option value="">Striker</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="w-full p-4 bg-slate-800 rounded-xl" value={match.nonStrikerId === null ? "" : match.nonStrikerId} onChange={(e)=>setMatch(p=>({...p, nonStrikerId: Number(e.target.value)}))}>
                  <option value="">Non-Striker</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="w-full p-4 bg-slate-800 rounded-xl" value={match.bowler || ""} onChange={(e)=>setMatch(p=>({...p, bowler: e.target.value}))}>
                  <option value="">Bowler</option>
                  {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <button onClick={() => {
                  if(match.strikerId === null || match.nonStrikerId === null || !match.bowler) return alert("Select all!");
                  setShowModal(null);
                }} className="w-full bg-blue-600 py-4 rounded-2xl font-black mt-4">Start Playing</button>
              </div>
            )}

            {showModal === 'over-end' && (
              <div className="grid gap-2">
                <p className="text-[10px] text-center text-slate-500 mb-2 font-bold uppercase">Pichla Bowler: {match.lastBowler}</p>
                {players.filter(p => p.name !== match.lastBowler).map(p => (
                  <button key={p.id} onClick={()=>{setMatch({...match, bowler: p.name}); setShowModal(null);}} className="p-4 bg-slate-800 rounded-xl font-bold hover:bg-blue-600">🏏 {p.name}</button>
                ))}
              </div>
            )}

            {showModal === 'new-batsman' && (
              <div className="grid gap-2">
                {players.filter(p => !p.isOut && p.id !== match.nonStrikerId).map(p => (
                  <button key={p.id} onClick={()=>{setMatch({...match, strikerId: p.id}); setShowModal(null);}} className="p-4 bg-slate-800 rounded-xl font-bold hover:bg-red-600 text-left">👤 {p.name}</button>
                ))}
              </div>
            )}

            {showModal === 'adjust' && (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-500 mb-2 uppercase tracking-widest">Total Score</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black">{match.totalRuns}</span>
                    <div className="flex gap-2">
                      <button onClick={()=>adjustScore('totalRuns', -1)} className="bg-red-600 w-8 h-8 rounded-lg font-bold">-</button>
                      <button onClick={()=>adjustScore('totalRuns', 1)} className="bg-green-600 w-8 h-8 rounded-lg font-bold">+</button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-500 mb-2 uppercase tracking-widest">Overs Control</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black font-mono">{match.completedOvers}.{match.ballsInOver}</span>
                    <div className="flex gap-2">
                      <button onClick={()=>adjustScore('ballMinus')} className="bg-slate-700 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">- Ball</button>
                      <button onClick={()=>adjustScore('ballPlus')} className="bg-slate-700 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">+ Ball</button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Striker: {getPlayer(match.strikerId).name}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Runs: {getPlayer(match.strikerId).runs}</span>
                    <div className="flex gap-2">
                      <button onClick={()=>adjustScore('strikerRuns', -1)} className="bg-slate-700 w-6 h-6 rounded font-bold">-</button>
                      <button onClick={()=>adjustScore('strikerRuns', 1)} className="bg-slate-700 w-6 h-6 rounded font-bold">+</button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Non-Striker: {getPlayer(match.nonStrikerId).name}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Runs: {getPlayer(match.nonStrikerId).runs}</span>
                    <div className="flex gap-2">
                      <button onClick={()=>adjustScore('nonStrikerRuns', -1)} className="bg-slate-700 w-6 h-6 rounded font-bold">-</button>
                      <button onClick={()=>adjustScore('nonStrikerRuns', 1)} className="bg-slate-700 w-6 h-6 rounded font-bold">+</button>
                    </div>
                  </div>
                </div>

                <button onClick={()=>setShowModal(null)} className="w-full bg-blue-600 py-4 rounded-2xl font-black mt-2">CONFIRM & CLOSE</button>
              </div>
            )}

            {showModal === 'innings-break' && (
              <div className="text-center py-4">
                 <p className="text-4xl font-black mb-8 tracking-tighter uppercase">Target: {target}</p>
                 <button onClick={() => {
                   const resetPlayers = players.map(p => ({ ...p, runs: 0, balls: 0, sixes: 0, fours: 0, isOut: false }));
                   setPlayers(resetPlayers);
                   setMatch({ totalRuns: 0, wickets: 0, ballsInOver: 0, completedOvers: 0, strikerId: null, nonStrikerId: null, bowler: "", lastBowler: "" });
                   setInnings(2); setShowModal('initial-selection');
                 }} className="w-full bg-blue-600 py-5 rounded-2xl font-black">2ND INNINGS START</button>
              </div>
            )}
          </div>
        </div>
      )}

      {winner && !showReport && (
        <div className="fixed inset-0 bg-blue-700 z-50 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95">
          <h1 className="text-6xl font-black mb-8 tracking-tighter">{winner.toUpperCase()}</h1>
          <div className="space-y-4 w-full max-w-xs">
            <button onClick={()=>setShowReport(true)} className="w-full bg-white text-blue-700 py-5 rounded-3xl font-black text-lg shadow-2xl">VIEW MATCH REPORT</button>
            <button onClick={resetAll} className="w-full bg-black text-white py-5 rounded-3xl font-black text-lg">NEW MATCH</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;