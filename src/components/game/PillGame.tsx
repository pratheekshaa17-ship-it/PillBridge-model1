import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Gamepad2, Trophy, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

interface PillGameProps {
  medications: any[];
}

export function PillGame({ medications }: PillGameProps) {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBestScore();
    }
  }, [user]);

  const fetchBestScore = async () => {
    try {
      const res = await fetch(`${API_BASE}/game_scores?patient_id=${user._id}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setBestScore(data[0].score);
      }
    } catch (error) {
      // No scores yet
    }
  };

  const generateQuestions = () => {
    console.log('Total medications passed to game:', medications.length);
    console.log('Medications data:', medications);
    
    if (medications.length < 2) {
      console.log('Not enough medications total. Need at least 2, have:', medications.length);
      return [];
    }

    // Filter medications that have any image URL (including placeholders for now)
    // We'll improve this to prioritize real uploaded images but allow placeholders if needed
    const medicationsWithImages = medications.filter(med => {
      const hasImage = med.image_url && med.image_url.trim() !== '';
      console.log(`Medication ${med.name}: has image = ${hasImage}, image_url = ${med.image_url}`);
      return hasImage;
    });

    console.log('Medications with images:', medicationsWithImages.length);
    console.log('Image URLs:', medicationsWithImages.map(m => ({ name: m.name, url: m.image_url })));

    if (medicationsWithImages.length < 2) {
      console.log('Not enough medications with images for game. Need at least 2, have:', medicationsWithImages.length);
      // Generate placeholder images for medications without them
      const medicationsWithPlaceholders = medications.map(med => {
        if (!med.image_url || med.image_url.trim() === '') {
          return {
            ...med,
            image_url: `https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=${encodeURIComponent(med.name || 'Pill')}`
          };
        }
        return med;
      });
      
      console.log('Using medications with placeholders:', medicationsWithPlaceholders.length);
      if (medicationsWithPlaceholders.length < 2) {
        return [];
      }
      
      // Use medications with placeholders instead
      const gameQuestions = [];
      const questionCount = Math.min(5, medicationsWithPlaceholders.length);
      const maxWrongAnswers = Math.min(3, medicationsWithPlaceholders.length - 1);

      for (let i = 0; i < questionCount; i++) {
        const correctMed = medicationsWithPlaceholders[i];
        const otherMeds = medicationsWithPlaceholders.filter(med => (med._id || med.id) !== (correctMed._id || correctMed.id));
        const wrongAnswers = otherMeds
          .sort(() => 0.5 - Math.random())
          .slice(0, maxWrongAnswers)
          .map(med => med.name);

        const answers = [correctMed.name, ...wrongAnswers]
          .sort(() => 0.5 - Math.random());

        gameQuestions.push({
          medication: correctMed,
          answers: answers,
          correctAnswer: correctMed.name,
        });
      }

      return gameQuestions;
    }

    const gameQuestions = [];
    const questionCount = Math.min(5, medicationsWithImages.length);
    const maxWrongAnswers = Math.min(3, medicationsWithImages.length - 1);

    for (let i = 0; i < questionCount; i++) {
      const correctMed = medicationsWithImages[i];
      const otherMeds = medicationsWithImages.filter(med => (med._id || med.id) !== (correctMed._id || correctMed.id));
      const wrongAnswers = otherMeds
        .sort(() => 0.5 - Math.random())
        .slice(0, maxWrongAnswers)
        .map(med => med.name);

      const answers = [correctMed.name, ...wrongAnswers]
        .sort(() => 0.5 - Math.random());

      gameQuestions.push({
        medication: correctMed,
        answers: answers,
        correctAnswer: correctMed.name,
      });
    }

    return gameQuestions;
  };

  const startGame = () => {
    const newQuestions = generateQuestions();
    console.log('Generated questions count:', newQuestions.length);
    
    if (newQuestions.length === 0) {
      console.log('Cannot start game: no questions generated');
      alert('Unable to start game. Please add more medications or check console for details.');
      return;
    }

    // Debug: Log medications and their image URLs
    console.log('Starting game with medications:', medications.map(med => ({
      name: med.name,
      id: med._id || med.id,
      image_url: med.image_url,
      hasImage: !!med.image_url
    })));
    
    console.log('Generated questions:', newQuestions.map(q => ({
      medication: q.medication.name,
      image_url: q.medication.image_url,
      answers: q.answers
    })));

    setQuestions(newQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setGameState('playing');
    setShowResult(false);
    setSelectedAnswer(null);
    setImageLoadError(null);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setTimeout(() => {
      const isCorrect = answer === questions[currentQuestion].correctAnswer;
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
      setShowResult(true);
      setTimeout(() => {
        if (currentQuestion + 1 < questions.length) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
          setShowResult(false);
          setImageLoadError(null);
        } else {
          finishGame();
        }
      }, 1500);
    }, 500);
  };

  const finishGame = async () => {
    setGameState('finished');
    try {
      const finalScore = score + (selectedAnswer === questions[currentQuestion]?.correctAnswer ? 1 : 0);
      const res = await fetch(`${API_BASE}/game_scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user._id,
          score: finalScore,
          total_questions: questions.length,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      if (!res.ok) throw new Error('Failed to save game score');
      if (finalScore > bestScore) {
        setBestScore(finalScore);
      }
    } catch (error) {
      console.error('Error saving game score:', error);
    }
  };

  const handleImageError = (imageUrl: string) => {
    console.error('Failed to load image:', imageUrl);
    setImageLoadError(`Failed to load image: ${imageUrl}`);
  };

  const handleImageLoad = () => {
    setImageLoadError(null);
  };

  if (medications.length < 2) {
    return (
      <div className="text-center py-12">
        <Gamepad2 className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Not Ready Yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Add at least 2 medications with photos to play the Pill Recognition Game
        </p>
      </div>
    );
  }

  if (gameState === 'menu') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Gamepad2 className="h-10 w-10 text-purple-600 dark:text-purple-400" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Pill Recognition Challenge</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Test your knowledge by matching medication names to their photos. 
          This helps reinforce your medication recognition skills!
        </p>

        {/* Game Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How to Play:</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>• Look at the medication image shown</p>
            <p>• Choose the correct medication name from the options</p>
            <p>• Answer as many questions as you can</p>
            <p>• Try to beat your best score!</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Best Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{bestScore}</p>
            </div>
            
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Available Medications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{medications.length}</p>
            </div>
          </div>
        </div>

        <button
          onClick={startGame}
          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white text-xl font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
        >
          Start Game
        </button>
      </div>
    );
  }

  if (gameState === 'playing') {
    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correctAnswer;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Question {currentQuestion + 1} of {questions.length}
            </h2>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{score}/{questions.length}</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Which medication is this?
            </h3>
            
            <div className="w-64 h-64 mx-auto mb-6 bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden relative">
              {question.medication.image_url ? (
                <>
                  <img
                    src={question.medication.image_url}
                    alt={`${question.medication.name} medication`}
                    className="w-full h-full object-cover"
                    onLoad={handleImageLoad}
                    onError={() => handleImageError(question.medication.image_url)}
                  />
                  {/* Fallback for when image fails to load */}
                  <div 
                    className="w-full h-full flex items-center justify-center absolute inset-0 bg-gray-100 dark:bg-slate-700"
                    style={{ display: imageLoadError ? 'flex' : 'none' }}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Gamepad2 className="h-8 w-8 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-red-600 dark:text-red-300">Image not available</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Medication: {question.medication.name}</p>
                      {imageLoadError && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 break-all px-2">{imageLoadError}</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Gamepad2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">No image available</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Medication: {question.medication.name}</p>
                    {/* Generate a placeholder image URL for medications without images */}
                    {question.medication.name && (
                      <div className="mt-2">
                        <img
                          src={`https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=${encodeURIComponent(question.medication.name)}`}
                          alt={`${question.medication.name} placeholder`}
                          className="w-32 h-32 mx-auto rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {question.answers.map((answer: string, index: number) => {
              let buttonClass = "w-full p-4 text-lg font-medium rounded-lg border-2 transition-all duration-200 ";
              
              if (showResult && selectedAnswer) {
                if (answer === question.correctAnswer) {
                  buttonClass += "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300";
                } else if (answer === selectedAnswer && answer !== question.correctAnswer) {
                  buttonClass += "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300";
                } else {
                  buttonClass += "border-gray-200 bg-gray-50 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400";
                }
              } else if (selectedAnswer === answer) {
                buttonClass += "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
              } else {
                buttonClass += "border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:text-gray-300";
              }

              return (
                <button
                  key={index}
                  onClick={() => !selectedAnswer && handleAnswerSelect(answer)}
                  disabled={!!selectedAnswer}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <span>{answer}</span>
                    {showResult && answer === question.correctAnswer && (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                    {showResult && answer === selectedAnswer && answer !== question.correctAnswer && (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const finalScore = score;
    const percentage = (finalScore / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Game Complete!</h2>
          
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Your Score</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{finalScore}/{questions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Percentage</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{percentage.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {finalScore > bestScore && (
            <div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 dark:text-yellow-200 font-semibold">🎉 New Best Score!</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={() => setGameState('menu')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors duration-200 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-gray-200"
            >
              Back to Menu
            </button>
            <button
              onClick={startGame}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center dark:bg-purple-500 dark:hover:bg-purple-400"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}