{
	"targets": [
		{
			"target_name": "kpion",
			"sources": [ "native/kpion.cpp" ],
			"libraries": [
				"-lcryptopp"
			],
			"cflags_cc!": [ "-fno-rtti", "-fno-exceptions" ]
		}
	]
}
