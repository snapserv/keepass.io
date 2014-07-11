{
	"targets": [
		{
			"target_name": "kpion",
			"sources": [ "kpion.cpp" ],
			"libraries": [
				"-lcryptopp"
			],
			"cflags_cc!": [ "-fno-rtti", "-fno-exceptions" ]
		}
	]
}
