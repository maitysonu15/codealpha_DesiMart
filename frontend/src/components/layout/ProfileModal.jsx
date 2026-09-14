import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';

export default function ProfileModal({ isOpen, onClose, navigateTo, initialTab = 'details' }) {
  const { currentUser, updateUserProfile, changePassword, logout } = useAuth();
  const { products, addToCart } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileMobile, setProfileMobile] = useState('');

  // Address Edit State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');

  // Change Password State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  if (!isOpen) return null;

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  // Save Profile Details
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }
    updateUserProfile({
      name: profileName.trim(),
      email: profileEmail.trim(),
      mobile: profileMobile.trim()
    });
    setIsEditingProfile(false);
  };

  // Save Address
  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!addressInput.trim()) {
      showToast('Please enter a valid delivery address.', 'error');
      return;
    }
    updateUserProfile({ address: addressInput.trim() });
    setIsEditingAddress(false);
  };

  // Save Password Change
  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (!currentPwd) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (!newPwd || newPwd.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPwd !== confirmPwd) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    const res = changePassword(currentPwd, newPwd);
    if (res.success) {
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    }
  };

  const handleLogoutClick = () => {
    logout();
    onClose();
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card profile-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-header-title">
            <span style={{ fontSize: '1.2rem' }}>👤</span>
            <span>My Account &amp; Settings</span>
          </div>
          <button className="auth-modal-close-btn" onClick={onClose} aria-label="Close Profile">
            ✕
          </button>
        </div>

        <div className="auth-modal-body">
          {/* Segmented Tab Bar */}
          <div className="auth-tab-track">
            <button
              className={`auth-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              👤 Profile
            </button>

            <button
              className={`auth-tab-btn ${activeTab === 'address' ? 'active' : ''}`}
              onClick={() => setActiveTab('address')}
            >
              📍 Addresses
            </button>

            <button
              className={`auth-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              🔒 Security
            </button>

            <button
              className={`auth-tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('wishlist')}
            >
              ❤️ Wishlist ({wishlistIds.length})
            </button>
          </div>

          {/* TAB 1: PROFILE DETAILS */}
          {activeTab === 'details' && (
            <div style={{ marginTop: '18px' }}>
              {currentUser ? (
                <>
                  <div className="profile-user-hero-badge">
                    <div className="user-avatar-circle" style={{ overflow: 'hidden' }}>
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt={currentUser.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div>
                      <div className="user-display-name">{currentUser.name}</div>
                      <div className="user-status-pill">🌿 VERIFIED DESIMART MEMBER</div>
                    </div>
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} style={{ marginTop: '16px' }}>
                      <div className="form-group">
                        <label className="auth-input-label">Full Name</label>
                        <input
                          type="text"
                          className="auth-mint-input"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="auth-input-label">Email Address</label>
                        <input
                          type="email"
                          className="auth-mint-input"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="auth-input-label">Mobile Number</label>
                        <input
                          type="tel"
                          className="auth-mint-input"
                          value={profileMobile}
                          onChange={(e) => setProfileMobile(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button type="submit" className="auth-submit-btn" style={{ flex: 1 }}>
                          Save Details
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setIsEditingProfile(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="profile-info-grid">
                        <div className="profile-info-item">
                          <div className="info-lbl">📱 Mobile Number</div>
                          <div className="info-val">{currentUser.mobile || 'Not provided'}</div>
                        </div>

                        <div className="profile-info-item">
                          <div className="info-lbl">✉️ Email Address</div>
                          <div className="info-val">{currentUser.email}</div>
                        </div>

                        <div className="profile-info-item full-width">
                          <div className="info-lbl">🗓️ Member Since</div>
                          <div className="info-val">{currentUser.createdAt || '2026'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button
                          type="button"
                          className="auth-submit-btn"
                          style={{ background: '#3B82F6', flex: 1 }}
                          onClick={() => {
                            setProfileName(currentUser?.name || '');
                            setProfileEmail(currentUser?.email || '');
                            setProfileMobile(currentUser?.mobile || '');
                            setIsEditingProfile(true);
                          }}
                        >
                          ✏️ Edit Profile Details
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                          onClick={handleLogoutClick}
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 12px 12px' }}>
                  <div className="empty-wishlist-icon">👤</div>
                  <div className="empty-wishlist-title">Guest Session — Not Signed In</div>
                  <p className="empty-wishlist-sub" style={{ maxWidth: '340px', margin: '8px auto 20px' }}>
                    Sign in to manage your profile, saved addresses, and active orders.
                  </p>
                  <button
                    className="auth-submit-btn"
                    onClick={() => {
                      onClose();
                      navigateTo('login');
                    }}
                  >
                    Sign In / Create Account →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === 'address' && (
            <div style={{ marginTop: '18px' }}>
              {currentUser ? (
                <>
                  <div className="auth-form-heading">Saved Delivery Address</div>
                  <p className="auth-form-subheading">
                    This address will be auto-filled during quick 1-click checkouts.
                  </p>

                  {isEditingAddress ? (
                    <form onSubmit={handleSaveAddress} style={{ marginTop: '14px' }}>
                      <div className="form-group">
                        <label className="auth-input-label">Full Street Address &amp; Pincode</label>
                        <textarea
                          rows={3}
                          className="auth-mint-input"
                          style={{ resize: 'vertical' }}
                          value={addressInput}
                          onChange={(e) => setAddressInput(e.target.value)}
                          placeholder="House/Flat No., Building Name, Street, Landmark, City - Pincode"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button type="submit" className="auth-submit-btn" style={{ flex: 1 }}>
                          Save Address
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setIsEditingAddress(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="address-item-card">
                      <div className="address-head">
                        <span className="address-label">Primary Delivery Address</span>
                        <span className="default-badge">Active</span>
                      </div>
                      <p className="address-text">
                        {currentUser.address || 'No default address saved yet.'}
                      </p>
                      <button
                        type="button"
                        className="auth-link-action"
                        onClick={() => {
                          setAddressInput(currentUser.address || '');
                          setIsEditingAddress(true);
                        }}
                        style={{ marginTop: '10px', fontSize: '0.86rem', display: 'inline-block' }}
                      >
                        ✏️ {currentUser.address ? 'Edit Address' : '+ Add Address'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>Please Sign In to manage delivery addresses.</p>
                  <button
                    className="auth-submit-btn"
                    style={{ marginTop: '12px' }}
                    onClick={() => {
                      onClose();
                      navigateTo('login');
                    }}
                  >
                    Sign In →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCOUNT SECURITY & CHANGE PASSWORD */}
          {activeTab === 'security' && (
            <div style={{ marginTop: '18px' }}>
              {currentUser ? (
                <form onSubmit={handleChangePasswordSubmit}>
                  <div className="auth-form-heading">Change Password</div>
                  <p className="auth-form-subheading">
                    Update your account password to maintain maximum account security.
                  </p>

                  <div className="form-group">
                    <label className="auth-input-label">Current Password</label>
                    <input
                      type="password"
                      className="auth-mint-input"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label className="auth-input-label">New Password</label>
                    <input
                      type="password"
                      className="auth-mint-input"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div className="form-group">
                    <label className="auth-input-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="auth-mint-input"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <button type="submit" className="auth-submit-btn">
                    Update Password →
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>Please Sign In to change password.</p>
                  <button
                    className="auth-submit-btn"
                    style={{ marginTop: '12px' }}
                    onClick={() => {
                      onClose();
                      navigateTo('login');
                    }}
                  >
                    Sign In →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div style={{ marginTop: '18px' }}>
              <div className="auth-form-heading">My Saved Wishlist</div>
              <p className="auth-form-subheading">
                Items saved in your wishlist to buy in the future.
              </p>

              {wishlistProducts.length === 0 ? (
                <div className="empty-wishlist-box">
                  <div className="empty-wishlist-icon">❤️</div>
                  <div className="empty-wishlist-title">Your Wishlist is Empty</div>
                  <p className="empty-wishlist-sub">
                    Click the heart icon on any product to save items here for future orders.
                  </p>
                  <button
                    className="auth-submit-btn"
                    onClick={() => {
                      onClose();
                      navigateTo('products');
                    }}
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                <div className="wishlist-modal-scroll">
                  {wishlistProducts.map((p) => (
                    <div key={p.id} className="wishlist-item-row">
                      <div className="wishlist-item-thumb">
                        {p.image ? <img src={p.image} alt={p.name} /> : <span>{p.emoji}</span>}
                      </div>

                      <div className="wishlist-item-info">
                        <div className="wishlist-item-title">{p.name}</div>
                        <div className="wishlist-item-price">₹{p.price.toLocaleString('en-IN')}</div>
                      </div>

                      <div className="wishlist-item-actions">
                        <button
                          className="wishlist-add-cart-btn"
                          onClick={() => {
                            addToCart(p.id, 1);
                          }}
                        >
                          + Cart
                        </button>

                        <button
                          className="wishlist-remove-btn"
                          onClick={() => toggleWishlist(p.id, p.name)}
                          title="Remove from wishlist"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
