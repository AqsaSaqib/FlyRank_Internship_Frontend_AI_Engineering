/* ==========================================================================
   BILLING & PLANS TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';
import { modal } from '../modal.js';

export function initBillingTab() {
  const planCards = document.querySelectorAll('.plan-card');
  const updateCardBtn = document.getElementById('open-update-card-modal');
  const saveCardForm = document.getElementById('update-card-form');
  const cardLast4El = document.getElementById('card-last4-display');
  const cardExpiryEl = document.getElementById('card-expiry-display');

  const syncFromState = () => {
    const b = appState.get('billing') || {};

    // Sync Active Plan
    planCards.forEach(card => {
      const plan = card.getAttribute('data-plan-tier');
      const isCurrent = plan === b.currentPlan;
      card.classList.toggle('current-plan', isCurrent);

      const btn = card.querySelector('.plan-action-btn');
      if (btn) {
        if (isCurrent) {
          btn.className = 'btn btn-secondary btn-sm plan-action-btn';
          btn.textContent = 'Current Plan';
          btn.disabled = true;
        } else {
          btn.className = 'btn btn-primary btn-sm plan-action-btn';
          btn.textContent = 'Switch to ' + plan.charAt(0).toUpperCase() + plan.slice(1);
          btn.disabled = false;
        }
      }
    });

    if (cardLast4El && b.cardLast4) cardLast4El.textContent = `•••• ${b.cardLast4}`;
    if (cardExpiryEl && b.cardExpiry) cardExpiryEl.textContent = b.cardExpiry;
  };

  // Plan Switching
  planCards.forEach(card => {
    const btn = card.querySelector('.plan-action-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const targetPlan = card.getAttribute('data-plan-tier');
        appState.set('billing.currentPlan', targetPlan, true);
        syncFromState();
        toast.success('Plan Updated', `You are now subscribed to the ${targetPlan.toUpperCase()} tier.`);
      });
    }
  });

  // Update Payment Method Modal
  if (updateCardBtn) {
    updateCardBtn.addEventListener('click', () => modal.open('modal-update-card'));
  }

  if (saveCardForm) {
    saveCardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const numInput = document.getElementById('input-card-number');
      const expInput = document.getElementById('input-card-expiry');

      const num = numInput ? numInput.value.replace(/\s+/g, '') : '4242';
      const exp = expInput ? expInput.value : '12/29';
      const last4 = num.slice(-4) || '4242';

      appState.set('billing.cardLast4', last4);
      appState.set('billing.cardExpiry', exp);
      appState.saveToStorage();

      modal.close('modal-update-card');
      syncFromState();
      toast.success('Payment Card Updated', `Primary card ending in •••• ${last4} saved.`);
    });
  }

  // Invoice Download Simulation
  document.querySelectorAll('.download-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const invId = btn.getAttribute('data-inv-id') || 'INV-2026-001';
      toast.info('Downloading Invoice', `Preparing PDF receipt for ${invId}...`);
      setTimeout(() => {
        toast.success('Invoice Downloaded', `${invId}.pdf saved to your downloads.`);
      }, 1000);
    });
  });

  // Initial Sync
  syncFromState();
  appState.subscribe((state, path) => {
    if (path.startsWith('billing') || path === '') {
      syncFromState();
    }
  });
}
