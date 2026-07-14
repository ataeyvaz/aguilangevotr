/**
 * gen-verbs-tr.cjs — Eski verbs-a1.json'a (en/es/pt/pron) TR + DE ekleyip
 * düz formatta src/data/verbs-tr-a1.json üretir.
 */
const fs = require('fs')
const path = require('path')
const old = require('../src/data/verbs-a1.json').words

const TR = {
  be:'olmak', have:'sahip olmak', do:'yapmak', go:'gitmek', come:'gelmek', see:'görmek',
  know:'bilmek', get:'almak', give:'vermek', take:'almak', make:'yapmak', say:'söylemek',
  think:'düşünmek', look:'bakmak', want:'istemek', use:'kullanmak', find:'bulmak', tell:'anlatmak',
  ask:'sormak', work:'çalışmak', feel:'hissetmek', try:'denemek', leave:'ayrılmak', call:'aramak',
  keep:'tutmak', let:'izin vermek', run:'koşmak', put:'koymak', mean:'anlamına gelmek', become:'olmak',
  show:'göstermek', play:'oynamak', move:'hareket etmek', live:'yaşamak', pay:'ödemek', hear:'duymak',
  sit:'oturmak', stand:'ayakta durmak', lose:'kaybetmek', bring:'getirmek', begin:'başlamak',
  walk:'yürümek', write:'yazmak', read:'okumak', eat:'yemek', drink:'içmek', sleep:'uyumak',
  swim:'yüzmek', jump:'zıplamak', fly:'uçmak', sing:'şarkı söylemek', dance:'dans etmek',
  buy:'satın almak', sell:'satmak', open:'açmak', close:'kapatmak', help:'yardım etmek',
  learn:'öğrenmek', teach:'öğretmek', turn:'dönmek', start:'başlamak', stop:'durmak',
  finish:'bitirmek', love:'sevmek', like:'hoşlanmak', hate:'nefret etmek', achieve:'başarmak',
  agree:'katılmak', allow:'izin vermek', appear:'görünmek', arrange:'düzenlemek', arrive:'varmak',
  borrow:'ödünç almak', break:'kırmak', build:'inşa etmek', carry:'taşımak', catch:'yakalamak',
  change:'değiştirmek', check:'kontrol etmek', choose:'seçmek', collect:'toplamak', contain:'içermek',
  continue:'devam etmek', cook:'pişirmek', count:'saymak', decide:'karar vermek', describe:'tanımlamak',
  discover:'keşfetmek', draw:'çizmek', dream:'hayal kurmak', drive:'araba sürmek', drop:'düşürmek',
  enjoy:'keyif almak', exist:'var olmak', explain:'açıklamak', fall:'düşmek', follow:'takip etmek',
  forget:'unutmak', grow:'büyümek', happen:'gerçekleşmek', hope:'ummak', join:'katılmak',
  laugh:'gülmek', listen:'dinlemek', mention:'bahsetmek', miss:'özlemek', need:'ihtiyaç duymak',
  offer:'teklif etmek', order:'sipariş vermek', prefer:'tercih etmek', prepare:'hazırlamak',
  produce:'üretmek', promise:'söz vermek', prove:'kanıtlamak', receive:'almak', remember:'hatırlamak',
  repeat:'tekrarlamak', return:'geri dönmek', send:'göndermek', share:'paylaşmak', smell:'koklamak',
  spend:'harcamak', suggest:'önermek', taste:'tatmak', throw:'atmak', travel:'seyahat etmek',
  understand:'anlamak', visit:'ziyaret etmek', wait:'beklemek', win:'kazanmak',
}

const DE = {
  be:'sein', have:'haben', do:'tun', go:'gehen', come:'kommen', see:'sehen', know:'wissen',
  get:'bekommen', give:'geben', take:'nehmen', make:'machen', say:'sagen', think:'denken',
  look:'schauen', want:'wollen', use:'benutzen', find:'finden', tell:'erzählen', ask:'fragen',
  work:'arbeiten', feel:'fühlen', try:'versuchen', leave:'verlassen', call:'anrufen', keep:'behalten',
  let:'lassen', run:'rennen', put:'legen', mean:'bedeuten', become:'werden', show:'zeigen',
  play:'spielen', move:'bewegen', live:'leben', pay:'bezahlen', hear:'hören', sit:'sitzen',
  stand:'stehen', lose:'verlieren', bring:'bringen', begin:'beginnen', walk:'laufen', write:'schreiben',
  read:'lesen', eat:'essen', drink:'trinken', sleep:'schlafen', swim:'schwimmen', jump:'springen',
  fly:'fliegen', sing:'singen', dance:'tanzen', buy:'kaufen', sell:'verkaufen', open:'öffnen',
  close:'schließen', help:'helfen', learn:'lernen', teach:'lehren', turn:'drehen', start:'starten',
  stop:'stoppen', finish:'beenden', love:'lieben', like:'mögen', hate:'hassen', achieve:'erreichen',
  agree:'zustimmen', allow:'erlauben', appear:'erscheinen', arrange:'arrangieren', arrive:'ankommen',
  borrow:'leihen', break:'brechen', build:'bauen', carry:'tragen', catch:'fangen', change:'ändern',
  check:'prüfen', choose:'wählen', collect:'sammeln', contain:'enthalten', continue:'fortsetzen',
  cook:'kochen', count:'zählen', decide:'entscheiden', describe:'beschreiben', discover:'entdecken',
  draw:'zeichnen', dream:'träumen', drive:'fahren', drop:'fallen lassen', enjoy:'genießen',
  exist:'existieren', explain:'erklären', fall:'fallen', follow:'folgen', forget:'vergessen',
  grow:'wachsen', happen:'geschehen', hope:'hoffen', join:'beitreten', laugh:'lachen',
  listen:'zuhören', mention:'erwähnen', miss:'vermissen', need:'brauchen', offer:'anbieten',
  order:'bestellen', prefer:'bevorzugen', prepare:'vorbereiten', produce:'produzieren',
  promise:'versprechen', prove:'beweisen', receive:'erhalten', remember:'sich erinnern',
  repeat:'wiederholen', return:'zurückkehren', send:'senden', share:'teilen', smell:'riechen',
  spend:'ausgeben', suggest:'vorschlagen', taste:'schmecken', throw:'werfen', travel:'reisen',
  understand:'verstehen', visit:'besuchen', wait:'warten', win:'gewinnen',
}

const out = old.map(w => ({
  id: w.id, tr: TR[w.id] || null, en: w.en, es: w.es, pt: w.pt, de: DE[w.id] || null,
  level: 'A1', category: 'verbs', emoji: w.emoji || '⚡',
  ...(w.pron ? { ipa: { en: w.pron } } : {}),
}))

const missing = out.filter(w => !w.tr).map(w => w.en)
const outPath = path.join(__dirname, '..', 'src', 'data', 'verbs-tr-a1.json')
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')
console.log(`✅ ${out.length} fiil yazıldı → src/data/verbs-tr-a1.json`)
console.log(`   TR eksik: ${missing.length}`, missing.length ? missing : '')
