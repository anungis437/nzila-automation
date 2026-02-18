'use client'

import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    vertical: '',
    message: '',
  })

  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual form submission
    console.log('Form submitted:', formData)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 5000)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const verticals = [
    'Healthtech',
    'Uniontech',
    'Insurancetech',
    'Legaltech',
    'Fintech',
    'Trade & Commerce',
    'Justice & Equity',
    'Arts & Culture',
    'Agrotech',
    'Cybersecurity',
    'DevOps',
    'Other',
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-linear-to-r from-blue-600 to-indigo-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Get In Touch</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Let&apos;s discuss how Nzila Ventures can support your organization&apos;s technology
              needs.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we&apos;ll get back to you within 24-48 hours.
              </p>

              {submitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    Thank you! Your message has been sent successfully.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company/Organization
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label
                    htmlFor="vertical"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Industry/Vertical of Interest
                  </label>
                  <select
                    id="vertical"
                    name="vertical"
                    value={formData.vertical}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a vertical...</option>
                    {verticals.map((vertical) => (
                      <option key={vertical} value={vertical}>
                        {vertical}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about your needs..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <p className="text-gray-600 mb-8">
                Reach out through any of these channels. We&apos;re here to help transform your
                vision into reality.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <EnvelopeIcon className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a
                      href="mailto:contact@nzilaventures.com"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      contact@nzilaventures.com
                    </a>
                    <p className="text-sm text-gray-500 mt-1">We respond within 24-48 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <PhoneIcon className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                    <a href="tel:+1234567890" className="text-blue-600 hover:text-blue-700">
                      +1 (234) 567-890
                    </a>
                    <p className="text-sm text-gray-500 mt-1">Monday - Friday, 9am - 5pm EST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPinIcon className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Office</h3>
                    <p className="text-gray-600">
                      Global Operations
                      <br />
                      Remote-First Organization
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-12 bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Business Inquiries</h3>
                <p className="text-gray-600 text-sm mb-4">
                  For partnership opportunities, investment discussions, or platform collaborations,
                  please include relevant details in your message.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Platform integration opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Vertical-specific solutions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Strategic partnerships</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Custom development projects</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map or Additional CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Prefer to Login to Your Dashboard?
          </h2>
          <p className="text-gray-600 mb-6">
            Existing partners and team members can access the corporate dashboard.
          </p>
          <a
            href="/auth/signin"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Team Portal Login
          </a>
        </div>
      </section>
    </main>
  )
}
