import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';

export default function TutorialManager({ db, currentUser, onCompleteTutorial }) {
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (!db || !currentUser || !db.tutorials) return;

    // Find the first active tutorial that matches the user's role and hasn't been completed
    const completed = currentUser.completedTutorials || [];
    
    const userRole = currentUser.role || (currentUser.permissions?.includes('admin') ? 'curator' : 'author');

    const availableTutorial = db.tutorials.find(
      t => t.isActive && 
      (t.targetAudience === 'all' || t.targetAudience === userRole) && 
      !completed.includes(t.id)
    );

    if (availableTutorial && availableTutorial.steps && availableTutorial.steps.length > 0) {
      // Map to Joyride format
      const joyrideSteps = availableTutorial.steps.map(step => ({
        target: step.target || 'body', // 'body' se estiver vazio = centralizado na tela
        content: (
          <div>
            {step.title && <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-gold)' }}>{step.title}</h3>}
            <p style={{ margin: 0, color: 'var(--text-main)' }}>{step.content}</p>
          </div>
        ),
        placement: step.placement || 'center',
        disableBeacon: step.disableBeacon !== false, // default true
      }));

      setSteps(joyrideSteps);
      setActiveTutorial(availableTutorial);
    } else {
      setActiveTutorial(null);
      setSteps([]);
    }
  }, [db, currentUser]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      if (activeTutorial && onCompleteTutorial) {
        onCompleteTutorial(activeTutorial.id);
      }
      setActiveTutorial(null);
    }
  };

  if (!activeTutorial) return null;

  return (
    <Joyride
      steps={steps}
      run={true}
      continuous={true}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: 'var(--card-bg)',
          backgroundColor: 'var(--card-bg)',
          overlayColor: 'rgba(0, 0, 0, 0.75)',
          primaryColor: 'var(--accent-gold)',
          textColor: 'var(--text-main)',
          zIndex: 10000,
        },
        buttonClose: {
          display: 'none',
        },
        buttonNext: {
          backgroundColor: 'var(--accent-gold)',
          color: '#000',
          fontWeight: 'bold',
          borderRadius: '4px',
          padding: '0.5rem 1rem',
        },
        buttonBack: {
          color: 'var(--accent-gold)',
        },
        buttonSkip: {
          color: 'var(--text-muted)',
        }
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Avançar',
        skip: 'Pular Tour',
      }}
    />
  );
}
