import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const Profile = ({ onUserUpdate, onLogout }) => {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', location: '', land_size: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile', { credentials: 'include' })
      if (res.status === 401) {
        navigate('/login')
        return
      }
      const data = await res.json()
      setProfile(data)
      setFormData({ name: data.name, location: data.location, land_size: data.land_size })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        setProfile(prev => ({ ...prev, ...formData }))
        setEditing(false)
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        if (onUserUpdate) onUserUpdate()
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile.' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Could not save changes. Please try again.' })
    }
    setSaving(false)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setFormData({ name: profile.name, location: profile.location, land_size: profile.land_size })
    setMessage({ type: '', text: '' })
  }

  const handleLogoutClick = async () => {
    if (onLogout) await onLogout()
    navigate('/')
  }

  const initials = (profile?.name || profile?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-700 py-12">
      <div className="container mx-auto px-6 max-w-3xl">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 mb-8 group text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Profile Hero Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 *:animate-fade-in dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0 select-none dark:text-gray-100">
              {initials}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-2xl font-bold text-gray-800 mb-1 truncate dark:text-gray-100">
                {profile?.name || 'Farmer'}
              </h1>
              <p className="text-gray-500 text-sm mb-4">{profile?.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {profile?.location ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                    📍 {profile.location}
                  </span>
                ) : null}
                {profile?.land_size ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                    📏 {profile.land_size}
                  </span>
                ) : null}
                {!profile?.location && !profile?.land_size && (
                  <span className="text-xs text-gray-400 italic">No location or land size set — edit profile to add</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex sm:flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => { setEditing(true); setMessage({ type: '', text: '' }) }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-all shadow-sm hover:shadow-md *:animate-pulse-glow dark:bg-green-400 dark:hover:bg-green-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-all border border-red-100 hover:border-red-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span>{message.type === 'success' ? '✅' : '❌'}</span>
            {message.text}
          </div>
        )}

        {/* Edit Form */}
        {editing && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 animate-fade-in">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>✏️</span> Edit Profile
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-800"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profile?.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Village / City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📏 Land Size</label>
                  <input
                    type="text"
                    value={formData.land_size}
                    onChange={e => setFormData(p => ({ ...p, land_size: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="e.g. 2 acres"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Account Info Cards */}
        <div className="bg-white rounded-2xl shadow-xl p-8 dark:bg-slate-700/80 backdrop-blur-sm mb-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-5">Account Info</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Name', value: profile?.name || '—', icon: '👤' },
              { label: 'Email', value: profile?.email || '—', icon: '📧' },
              { label: 'Location', value: profile?.location || '—', icon: '📍' },
              { label: 'Land Size', value: profile?.land_size || '—', icon: '📏' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100 dark:bg-slate-500/80">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 dark:text-gray-300">
                  {icon} {label}
                </div>
                <div className="text-gray-800 font-medium dark:text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl dark:bg-slate-700/80 backdrop-blur-sm p-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-5">Quick Actions</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { to: '/crop-prediction', label: '🌾 Crop Prediction', desc: 'Get crop recommendations' },
              { to: '/disease-prediction', label: '🔬 Disease Detection', desc: 'Detect crop diseases' },
              { to: '/fertilizer', label: '🧪 Fertilizer', desc: 'Optimize fertilizer use' },
            ].map(({ to, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col p-4 rounded-xl bg-green-50 hover:bg-green-100 border border-green-100 hover:border-green-200 transition-all dark:bg-gray-100/20 dark:hover:bg-gray-100/30"
              >
                <span className="font-semibold text-green-700 text-sm mb-1 group-hover:translate-x-0.5 transition-transform dark:text-gray-50">
                  {label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-100">{desc}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Profile
