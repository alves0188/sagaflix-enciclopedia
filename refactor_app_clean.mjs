import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldFetchStart = code.indexOf('  const fetchData = async () => {');
const oldFetchEnd = code.indexOf('  useEffect(() => {', oldFetchStart);

if (oldFetchStart !== -1 && oldFetchEnd !== -1) {
  const newFetch = `  const fetchData = async () => {
    try {
      const savedUser = localStorage.getItem('sagaflix_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', parsed.id).single();
        if (profile) {
          const userObj = {
            id: profile.id, role: profile.role, name: profile.name, nickname: profile.nickname,
            email: profile.email, avatar: profile.avatar_url
          };
          setCurrentUser(userObj);
          localStorage.setItem('sagaflix_user', JSON.stringify(userObj));
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

`;
  code = code.substring(0, oldFetchStart) + newFetch + code.substring(oldFetchEnd);
  
  // Also remove setDb usage inside App.jsx since db doesn't need to be populated
  code = code.replace(/setDb\(db\);\n\s*if \(currentUser\)/g, 'if (currentUser)');
  
  fs.writeFileSync('src/App.jsx', code);
  console.log('App.jsx fetchData refactored to be lightweight!');
} else {
  console.log('fetchData not found in App.jsx');
}
