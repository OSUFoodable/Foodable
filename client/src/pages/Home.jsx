import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { startLogin } from "../config/cognito.js";
import { getDisplayName, getInitial } from "../utils/authHelpers";

const FEATURES = [
	{
		to: "/discover",
		icon: "🔍",
		title: "Discover Foods",
		desc: "Search foods and see nutrition & affordability info.",
	},
	{
		to: "/ingredients",
		icon: "🥦",
		title: "Ingredients",
		desc: "Track what you have on hand.",
	},
	{
		to: "/recipes",
		icon: "📖",
		title: "Recipes",
		desc: "Generate recipes from your ingredients.",
	},
	{
		to: "/community",
		icon: "💬",
		title: "Community",
		desc: "Share posts and tips with other Foodable users.",
	},
	{
		to: "/lists",
		icon: "📋",
		title: "My Lists",
		desc: "View and manage your saved grocery lists.",
	},
	{
		to: "/profile",
		icon: "👤",
		title: "Profile",
		desc: "Set dietary preferences and view saved posts.",
	},
];

function Home() {
	const { user, authReady } = useContext(AuthContext);

	const [health, setHealth] = useState(null);
	const [healthError, setHealthError] = useState("");

	useEffect(() => {
		axios
			.get("/api/health")
			.then((r) => setHealth(r.data))
			.catch((e) => setHealthError(e.message));
	}, []);

	return (
		<div className="app-page">
			<div className="app-shell">
				{/* Hero */}
				<div className="app-card-hero" style={{ marginBottom: 20 }}>
					<div
						className="app-flex-between"
						style={{ flexWrap: "wrap", gap: 16 }}
					>
						<div>
							<h1 className="app-title" style={{ fontSize: 28 }}>
								Foodable
							</h1>
							<p
								className="app-subtitle"
								style={{ marginTop: 8, maxWidth: 480 }}
							>
								Your smart food companion — track ingredients,
								discover nutrition info, generate recipes, and
								build grocery lists with AI.
							</p>
						</div>

						{!authReady ? (
							<span
								className="app-muted"
								style={{ fontSize: 13 }}
							>
								Checking login status…
							</span>
						) : user ? (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 10,
								}}
							>
								<div className="app-avatar">
									{getInitial(user)}
								</div>
								<div>
									<div
										style={{
											fontWeight: 700,
											fontSize: 14,
										}}
									>
										{getDisplayName(user)}
									</div>
									<div
										className="app-muted"
										style={{ fontSize: 12 }}
									>
										Logged in
									</div>
								</div>
							</div>
						) : (
							<button
								type="button"
								onClick={startLogin}
								className="app-btn app-btn-primary"
							>
								Register / Login
							</button>
						)}
					</div>
				</div>

				{/* Feature grid */}
				<div className="app-grid-2" style={{ marginBottom: 20 }}>
					{FEATURES.map((f) =>
						user ? (
							<Link
								key={f.to}
								to={f.to}
								className="app-feature-card"
							>
								<span className="app-feature-icon">
									{f.icon}
								</span>
								<span className="app-feature-title">
									{f.title}
								</span>
								<span className="app-feature-desc">
									{f.desc}
								</span>
							</Link>
						) : (
							<div
								key={f.to}
								className="app-feature-card"
								style={{ opacity: 0.5, cursor: "default" }}
							>
								<span className="app-feature-icon">
									{f.icon}
								</span>
								<span className="app-feature-title">
									{f.title}
								</span>
								<span className="app-feature-desc">
									{f.desc}
								</span>
							</div>
						),
					)}
				</div>

				{/* API health */}
				<details className="app-card" style={{ fontSize: 13 }}>
					<summary
						style={{
							cursor: "pointer",
							opacity: 0.7,
							userSelect: "none",
						}}
					>
						API status
					</summary>
					<div style={{ marginTop: 10 }}>
						{healthError && (
							<span className="app-error">{healthError}</span>
						)}
						{!healthError && !health && (
							<span className="app-muted">Loading…</span>
						)}
						{health && (
							<pre
								style={{
									margin: 0,
									opacity: 0.85,
									fontSize: 12,
								}}
							>
								{JSON.stringify(health, null, 2)}
							</pre>
						)}
					</div>
				</details>
			</div>
		</div>
	);
}

export default Home;
