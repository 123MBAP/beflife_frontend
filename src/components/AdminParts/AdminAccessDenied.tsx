import React from 'react';
import { FaUserCircle } from 'react-icons/fa';

export default function AdminAccessDenied() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-foodco-bg">
            <div className="text-center p-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaUserCircle size={48} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-600 mb-2">Access Denied</h2>
                <p className="text-gray-400">You don't have permission to access this page.</p>
            </div>
        </div>
    );
}
