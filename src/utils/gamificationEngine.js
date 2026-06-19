import { BADGES_DB, calculateLevel } from './gamificationConfig';

/**
 * Motor Automático de Gamificação
 * Verifica gatilhos, soma progresso e desbloqueia selos.
 * @param {Object} db - O banco de dados completo (estado atual)
 * @param {string} userId - ID do usuário atual
 * @param {string} eventType - Tipo do evento ('chapters_read', 'books_finished', etc)
 * @param {Object} payload - Dados adicionais do evento
 * @returns {Object} { newDb, unlockedBadges, totalXpGained }
 */
export function processGamificationEvent(db, userId, eventType, payload = {}) {
  // Deep clone para não mutar estado original diretamente (shallow copy do DB, deep copy do User)
  const newDb = { ...db };
  const userIndex = newDb.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return { newDb, unlockedBadges: [], totalXpGained: 0 };
  
  const user = { 
    ...newDb.users[userIndex],
    unlockedBadges: newDb.users[userIndex].unlockedBadges || [],
    badgeProgress: newDb.users[userIndex].badgeProgress || {},
    xp: newDb.users[userIndex].xp || 0
  };

  const unlockedBadges = [];
  let totalXpGained = 0;

  // Flatten todos os selos
  const allBadges = [];
  Object.keys(BADGES_DB).forEach(catId => {
    BADGES_DB[catId].forEach(badge => allBadges.push(badge));
  });

  // Percorre apenas os selos que o usuário AINDA NÃO TEM e que reagem ao EVENTO atual
  allBadges.forEach(badge => {
    if (user.unlockedBadges.some(ub => ub.id === badge.id)) return;
    if (badge.trigger !== eventType && badge.trigger !== 'total_badges') return;

    let currentProg = user.badgeProgress[badge.id] || 0;
    let oldProg = currentProg;

    // --- LÓGICA DE GATILHOS ---
    if (eventType === 'chapters_read') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'books_finished') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'book_halfway') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'streak_days') {
      currentProg = payload.streakDays || currentProg;
    }
    else if (eventType === 'night_reads') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'morning_reads') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'same_author') {
      // payload.authorMaxCount = qtd máxima de livros lidos do mesmo autor
      if (payload.authorMaxCount > currentProg) {
         currentProg = payload.authorMaxCount;
      }
    }
    else if (eventType === 'unique_authors') {
      currentProg = payload.uniqueAuthorsCount || currentProg;
    }
    else if (eventType === 'unique_genres') {
      currentProg = payload.uniqueGenresCount || currentProg;
    }
    else if (eventType === 'new_release_read') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'reviews_count') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'comments_count') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'library_saves') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'likes_received') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'likes_received_single') {
      if (payload.likesCount > currentProg) {
         currentProg = payload.likesCount;
      }
    }
    else if (eventType === 'fast_chapter') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'long_session_mins') {
      if (payload.sessionMins > currentProg) {
         currentProg = payload.sessionMins;
      }
    }
    else if (eventType === 'total_mins_read') {
      currentProg += payload.minsRead || 0;
    }
    else if (eventType === 'marathon_day') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'focus_mode_days') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'fast_book') {
      currentProg += payload.amount || 1;
    }
    else if (eventType === 'full_author_read') {
      currentProg += payload.amount || 1;
    }

    // Salva progresso
    user.badgeProgress[badge.id] = currentProg;

    // Checa desbloqueio
    if (currentProg >= badge.progMax && oldProg < badge.progMax) {
      user.unlockedBadges.push({
        id: badge.id,
        unlockedAt: new Date().toISOString()
      });
      user.xp += badge.xp;
      totalXpGained += badge.xp;
      unlockedBadges.push(badge);
    }
  });

  // Verificação especial para "Lenda do BookFlix" (desbloqueia 30 selos)
  const totalBadgesBadge = allBadges.find(b => b.trigger === 'total_badges');
  if (totalBadgesBadge && !user.unlockedBadges.some(ub => ub.id === totalBadgesBadge.id)) {
     const unlockedCount = user.unlockedBadges.length;
     user.badgeProgress[totalBadgesBadge.id] = unlockedCount;
     if (unlockedCount >= totalBadgesBadge.progMax) {
        user.unlockedBadges.push({
          id: totalBadgesBadge.id,
          unlockedAt: new Date().toISOString()
        });
        user.xp += totalBadgesBadge.xp;
        totalXpGained += totalBadgesBadge.xp;
        unlockedBadges.push(totalBadgesBadge);
     }
  }

  // Gera notificações no DB (global) para o usuário se houver selos ganhos
  if (unlockedBadges.length > 0) {
    const notifications = newDb.notifications || [];
    unlockedBadges.forEach(badge => {
      notifications.push({
        id: 'notif_' + Date.now() + Math.floor(Math.random() * 1000),
        userId: user.id,
        title: '🏆 Conquista Desbloqueada!',
        message: `Você ganhou o selo "${badge.name}" e recebeu +${badge.xp} XP!`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'gamification'
      });
    });
    newDb.notifications = notifications;
  }

  newDb.users[userIndex] = user;

  return { newDb, unlockedBadges, totalXpGained, updatedUser: user };
}
