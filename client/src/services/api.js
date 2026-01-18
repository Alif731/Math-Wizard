const API_URL = 'http://localhost:5000/api';

export const getProblem = async (username) => {
  const res = await fetch(`${API_URL}/problem?username=${username}`);
  return res.json();
};

export const submitAnswer = async (payload) => {
  const res = await fetch(`${API_URL}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const getStatus = async (username) => {
  const res = await fetch(`${API_URL}/status?username=${username}`);
  return res.json();
};
