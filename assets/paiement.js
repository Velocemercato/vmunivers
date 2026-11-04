/* Paiement d'un devis VM Studio validé via des liens de paiement Stripe hébergés (Payment Links).
   Aucune clé, aucun secret, aucune donnée de carte sur ce site : Stripe gère tout le paiement.
   Le site n'affiche un bouton que si : actif=true, CGV validées, lien https://buy.stripe.com/… */
(() => {
  const box = document.querySelector('[data-paiements]');
  if (!box) return;
  const list = box.querySelector('[data-paiements-liste]');
  const state = box.querySelector('[data-paiements-etat]');
  const okUrl = url => {
    try {
      const u = new URL(String(url || ''));
      return u.protocol === 'https:' && u.hostname === 'buy.stripe.com' && /^\/[A-Za-z0-9_]+$/.test(u.pathname) && !u.username && !u.password;
    } catch (_) { return false; }
  };
  const text = (tag, value, cls) => { const el = document.createElement(tag); el.textContent = value; if (cls) el.className = cls; return el; };
  fetch(box.dataset.paiements, {cache: 'no-store', credentials: 'omit'})
    .then(r => r.ok ? r.json() : Promise.reject(new Error('indisponible')))
    .then(data => {
      const liens = Array.isArray(data.liens) ? data.liens.filter(l => l && l.titre && okUrl(l.url)) : [];
      if (data.actif !== true || data.cgv_validees !== true || !liens.length) {
        state.textContent = 'Le paiement en ligne n’est pas encore ouvert. Demandez votre devis : nous vous enverrons le lien de paiement correspondant une fois le devis accepté.';
        return;
      }
      const test = data.mode !== 'live' || liens.some(l => /\/test_/.test(new URL(l.url).pathname));
      state.textContent = test ? '🧪 MODE TEST : aucun paiement réel. Utilisez une carte de test Stripe.' : 'Paiement sécurisé par Stripe. Vous serez redirigé vers la page de paiement Stripe.';
      if (test) state.classList.add('pay-test');
      liens.forEach(l => {
        const card = document.createElement('article');
        card.className = 'pay-card';
        card.append(text('h3', String(l.titre).slice(0, 80)));
        if (l.detail) card.append(text('p', String(l.detail).slice(0, 200)));
        if (l.prix) card.append(text('p', String(l.prix).slice(0, 40), 'pay-price'));
        const a = document.createElement('a');
        a.className = 'pro-button';
        a.href = l.url;
        a.rel = 'noopener';
        a.textContent = (l.type === 'abonnement' ? 'S’abonner' : 'Payer') + ' avec Stripe →';
        card.append(a);
        list.append(card);
      });
    })
    .catch(() => { state.textContent = 'Le paiement en ligne est momentanément indisponible. Écrivez-nous à vminvest.fr@gmail.com.'; });
})();
