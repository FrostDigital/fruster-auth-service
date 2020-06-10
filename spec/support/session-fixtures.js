module.exports = {

	sessions: [

		// App w/ version
		{
			id: "063ac7b6ae4f366ee9b14dea4b58f25bb6c64cc6529b3288e693a576cb889271e6a60a237a0d6156a185966df527edef2bf7b1108d0c5ed614ed488dd0d80e7a",
			userId: "707dea14-b56f-4444-be57-4ac96a74aad8",
			sessionDetails: {
				version: "13.0.1",
				userAgent: "wellbee%20Test/1184 CFNetwork/1125.2 Darwin/19.4.0",
				created: new Date("1994-06-11T12:32:20.699Z"),
				lastActivity: new Date("1995-06-11T12:32:20.699Z")
			},
			expires: new Date("2020-06-20T14:44:56.191Z")
		},

		// App w/ another version
		{
			id: "af42e4d3fcd05b7548af4bd20cfc9ff295e07ff29404d68617c1fa6dbc59ff8ca108ac5e3b6bcf46a696b768d6e3967d2c5d36e66680038b5cf985ddf75af6f1",
			userId: "707dea14-b56f-4444-be57-4ac96a74aad8",
			sessionDetails: {
				version: "13.4.1",
				userAgent: "wellbee%20Test/1184 CFNetwork/1125.2 Darwin/19.4.0",
				created: new Date(),
				lastActivity: new Date()
			},
			expires: new Date("2020-06-20T18:14:19.554Z")
		},

		// Desktop
		{
			id: "0369d87c7b4870b9f9d7b3f794a252c060e7dedcf442a4c00ba80e718ae43246d5934142bb9bf1570dc62cd1d49662d974b1a7bcf7025066b59dcf5d6c8543c1",
			userId: "707dea14-b56f-4444-be57-4ac96a74aad8",
			expires: new Date("2020-06-11T12:32:20.699Z"),
			sessionDetails: {
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.00",
				created: new Date("1999-06-11T12:32:20.699Z"),
				lastActivity: new Date("2000-06-11T12:32:20.699Z")
			}
		},

		// Old session without sessionDetails (this will only happen if user hasn't had any activity since this update).
		{
			id: "0369d87c7b4870b9f9d7b3f794a252c060e7dedcf442a4c00ba80e718ae43246d5934142bb9bf1570dc62cd1d49662d974b1a7bcf7025066b59dcf5d6c8543c1",
			userId: "707dea14-b56f-4444-be57-4ac96a74aad8",
			expires: new Date("2020-06-11T12:32:20.699Z")
		},

		// Another user
		{
			id: "0369d87c7b4870b9f9d7b3f794a252c060e7dedcf442a4c00ba80e718ae43246d5934142bb9bf1570dc62cd1d49662d974b1a7bcf7025066b59dcf5d6c8543c1",
			expires: new Date("2020-06-11T12:32:20.699Z"),
			sessionDetails: {
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.00",
				created: new Date(),
				lastActivity: new Date()
			}
		}

	]

};
