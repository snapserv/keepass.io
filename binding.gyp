{
	"targets": [
		{
			"target_name": "kpion",
			"sources": [ "native/kpion.cc" ],
			"include_dirs": [ '<!(node -e "require(\'nan\')")' ],
			"libraries": [ "-lcryptopp" ],
			"cflags_cc!": [ "-fno-rtti", "-fno-exceptions" ]
		}
	]
}
