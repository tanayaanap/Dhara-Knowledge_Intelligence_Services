import React from "react";

function AboutUs() {
    const teamMembers = [
        {
        role: "AI Research",
        icon: "🤖",
        description:
            "Developing cutting-edge machine learning models for agricultural predictions",
        },
        {
        role: "Agricultural Experts",
        icon: "👨‍🌾",
        description:
            "Bringing decades of farming experience and domain knowledge",
        },
        {
        role: "Data Scientists",
        icon: "📊",
        description:
            "Analyzing vast agricultural datasets to improve accuracy",
        },
    ];

    const features = [
        {
        title: "AI-Powered Predictions",
        description:
            "Advanced machine learning algorithms trained on thousands of agricultural data points to provide accurate crop, disease, and fertilizer recommendations.",
        icon: "🧠",
        },
        {
        title: "Real-time Analysis",
        description:
            "Get instant results based on current soil conditions, weather patterns, and historical agricultural data from your region.",
        icon: "⚡",
        },
        {
        title: "Sustainable Farming",
        description:
            "Our recommendations focus on sustainable practices that improve yield while protecting the environment for future generations.",
        icon: "🌍",
        },
        {
        title: "Expert Validation",
        description:
            "All our AI models are validated by agricultural experts to ensure practical and reliable recommendations.",
        icon: "✅",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-6xl mx-auto px-6">

            {/* Hero */}
            <div className="text-center mb-16">
            <div className="inline-block p-6 bg-green-100 rounded-full mb-6 dark:text-gray-200">
                <span className="text-6xl">🌾</span>
            </div>

            <h1 className="text-5xl font-bold text-gray-800 mb-6 dark:text-gray-200">
                About <span className="text-green-600">DHARA</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed dark:text-gray-400">
                Empowering farmers with AI to make smarter decisions, increase yields,
                and build a sustainable future for agriculture.
            </p>
            </div>

            {/* Mission */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-12 text-white mb-16 shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-center">
                Our Mission
            </h2>
            <p className="text-lg text-center max-w-4xl mx-auto">
                We aim to democratize access to agricultural intelligence using AI,
                helping farmers make data-driven decisions for better yield and sustainability.
            </p>
            </div>

            {/* Features */}
            <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center dark:text-gray-200">
                What We Do
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
                {features.map((feature, i) => (
                <div
                    key={i}
                    className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition dark:bg-slate-700/75"
                >
                    <div className="text-5xl mb-4">{feature.icon}</div>
                    <h3 className="text-2xl font-bold mb-3 dark:text-gray-200">
                    {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
                ))}
            </div>
            </div>

            {/* Team */}
            <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center dark:text-gray-200">
                Our Expertise
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
                {teamMembers.map((member, i) => (
                <div
                    key={i}
                    className="bg-white rounded-xl shadow-lg p-8 text-center hover:scale-105 transition dark:bg-slate-700/75"
                >
                    <div className="text-6xl mb-4">{member.icon}</div>
                    <h3 className="text-xl font-bold mb-3">
                    {member.role}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{member.description}</p>
                </div>
                ))}
            </div>
            </div>

            {/* Tech */}
            <div className="bg-gray-50 rounded-3xl p-12 mb-16 dark:bg-slate-600/75 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-center mb-8">
                Powered by Technology
            </h2>

            <div className="grid md:grid-cols-4 gap-6 text-center dark:text-gray-300">
                {[
                ["🤖", "Machine Learning"],
                ["📊", "Big Data"],
                ["☁️", "Cloud"],
                ["🌐", "IoT"],
                ].map(([icon, label], i) => (
                <div key={i}>
                    <div className="text-4xl mb-3">{icon}</div>
                    <p className="font-semibold">{label}</p>
                </div>
                ))}
            </div>
            </div>

            {/* Impact */}
            <div className="bg-white rounded-3xl shadow-xl p-12 mb-16 text-center dark:bg-slate-600/75 backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-8 dark:text-gray-200">Our Impact</h2>

            <div className="grid md:grid-cols-3 gap-8">
                <div>
                <div className="text-5xl font-bold text-green-600">10K+</div>
                <p>Farmers Helped</p>
                </div>
                <div>
                <div className="text-5xl font-bold text-green-600">95%</div>
                <p>Accuracy</p>
                </div>
                <div>
                <div className="text-5xl font-bold text-green-600">30%</div>
                <p>Yield Increase</p>
                </div>
            </div>
            </div>

            {/* Vision */}
            <div className="text-center bg-green-50 rounded-3xl p-12 dark:bg-slate-600/50">
            <h2 className="text-3xl font-bold mb-6 dark:text-gray-200">
                Our Vision
            </h2>
            <p className="max-w-3xl mx-auto mb-6 dark:text-gray-300">
                A world where every farmer has access to intelligent insights for
                better productivity and sustainability.
            </p>
            </div>
        </div>
        </div>
    );
}

export default AboutUs;