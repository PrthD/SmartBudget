import React, { useEffect, useState, useRef } from 'react';
import {
  fetchUserDetails,
  updateUserProfile,
  generateDefaultAvatar,
} from '../services/userService';
import { notifySuccess, notifyError } from '../utils/notificationService';
import NavBar from '../components/common/NavBar';
import '../styles/profile/ProfilePage.css';
import { FaCamera, FaEdit, FaTrash } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [password, setPassword] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const fetchedUser = await fetchUserDetails();
        setUser(fetchedUser);
        setName(fetchedUser.name || '');
        setEmail(fetchedUser.email || '');
        setProfilePhoto(fetchedUser.profilePhoto || '');
      } catch (err) {
        notifyError(err.message);
      }
    };
    getUserDetails();
  }, []);

  const handlePhotoUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return notifyError('Only JPG, PNG, and GIF images are allowed.');
    }

    if (file.size > 10 * 1024 * 1024) {
      return notifyError('File size must be less than 10MB.');
    }

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
        e.target.value = '';
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing the image:', error);
      notifyError('Failed to compress image. Please try again.');
    }
  };

  const removePhoto = () => {
    setProfilePhoto('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updates = {
        name,
        email,
      };
      if (password.trim().length >= 6) {
        updates.password = password;
      }
      if (typeof profilePhoto === 'string') {
        updates.profilePhoto = profilePhoto;
      }

      const updatedUser = await updateUserProfile(updates);
      setUser(updatedUser);
      setPassword('');
      notifySuccess('Profile updated successfully!');
      window.dispatchEvent(
        new CustomEvent('user-updated', { detail: updatedUser })
      );
    } catch (err) {
      notifyError(err.message);
    }
  };

  if (!user) {
    return (
      <div>
        <NavBar />
        <div className="profile-loading">Loading...</div>
      </div>
    );
  }

  const displayPhoto = profilePhoto
    ? profilePhoto
    : generateDefaultAvatar(user.name);

  const hasPhoto = !!profilePhoto;

  return (
    <>
      <NavBar />
      <div className="profile-container">
        <div className="profile-card">
          <h1 className="profile-title">Edit Profile</h1>
          <p className="profile-subtitle">
            Update your personal information and profile picture here.
          </p>

          <div
            className="profile-photo-container"
            title="Click to upload a new photo"
          >
            {hasPhoto && (
              <div className="photo-delete-icon" onClick={removePhoto}>
                <FaTrash />
              </div>
            )}

            <img
              src={displayPhoto}
              alt="Profile"
              className="profile-photo"
              onClick={handlePhotoUploadClick}
            />

            <div
              className="photo-overlay-icons"
              onClick={handlePhotoUploadClick}
            >
              {!hasPhoto ? <FaCamera /> : <FaEdit />}
            </div>
          </div>

          <input
            ref={fileInputRef}
            id="profilePhotoInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Form for user info */}
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="nameInput">Full Name</label>
              <input
                id="nameInput"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="emailInput">Email Address</label>
              <input
                id="emailInput"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="passwordInput">New Password (Optional)</label>
              <input
                id="passwordInput"
                type="password"
                placeholder="Leave blank if you don't want to change it"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="hint-text">
                At least 6 characters if you want to update your password.
              </span>
            </div>

            <button className="save-changes-btn" type="submit">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
